import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { Injectable, Logger, Optional } from '@nestjs/common';

import { TypedConfigService } from '@common/config/app-config';
import { RawCacheService } from '@common/raw-cache';
import { fail, ok, TResult } from '@common/types';
import { CACHE_KEYS, ERRORS } from '@libs/contracts/constants';
import {
    DatabaseBackupSettingsSchema,
    DEFAULT_DATABASE_BACKUP_SETTINGS,
    resolveDatabaseBackupCronExpression,
    TDatabaseBackupSettings,
} from '@libs/contracts/models';
import { UpdateDatabaseBackupSettingsCommand } from '@libs/contracts/commands';

import { TelegramApiService } from '@integration-modules/notifications/telegram-bot/telegram-api.service';

import { RemnawaveSettingsRepository } from '@modules/remnawave-settings/repositories/remnawave-settings.repository';
import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger/telegram-bot-logger.service';

import {
    buildBackupArchiveTelegramCaption,
    buildBackupFailureTelegramMessage,
    buildBackupPasswordTelegramMessage,
    buildBackupSuccessTelegramMessage,
    buildRestoreInstructions,
    computeNextScheduledBackupAt,
    generateBackupPassword,
    isStaleRunningBackup,
    shouldRunScheduledBackup,
} from './database-backup.helpers';

const execFileAsync = promisify(execFile);
const TELEGRAM_MAX_FILE_BYTES = 50 * 1024 * 1024;

@Injectable()
export class DatabaseBackupService {
    private readonly logger = new Logger(DatabaseBackupService.name);
    private cachedSettings: TDatabaseBackupSettings | null = null;

    constructor(
        private readonly remnawaveSettingsRepository: RemnawaveSettingsRepository,
        private readonly configService: TypedConfigService,
        private readonly rawCacheService: RawCacheService,
        private readonly telegramRoutesService: TelegramNotificationRoutesService,
        @Optional() private readonly telegramApiService?: TelegramApiService,
        @Optional() private readonly telegramQueue?: TelegramBotLoggerQueueService,
    ) {}

    public async getSettingsFromController(): Promise<TResult<TDatabaseBackupSettings>> {
        try {
            return ok(await this.resolveBackupSettings());
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_DATABASE_BACKUP_SETTINGS_ERROR);
        }
    }

    public async updateSettingsFromController(
        body: UpdateDatabaseBackupSettingsCommand.Request,
    ): Promise<TResult<TDatabaseBackupSettings>> {
        try {
            const current = await this.getSettings();
            const parsed = DatabaseBackupSettingsSchema.omit({
                lastBackupAt: true,
                lastBackupStatus: true,
                lastBackupError: true,
                lastBackupSizeBytes: true,
                lastBackupFileName: true,
                nextScheduledBackupAt: true,
            }).parse(body);

            const nextScheduledBackupAt = parsed.enabled
                ? computeNextScheduledBackupAt(parsed)?.toISOString() ?? null
                : null;

            const updated: TDatabaseBackupSettings = {
                ...current,
                ...parsed,
                nextScheduledBackupAt,
            };

            await this.persistSettings(updated);
            return ok(updated);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.UPDATE_DATABASE_BACKUP_SETTINGS_ERROR);
        }
    }

    public async prepareManualBackup(): Promise<TResult<void>> {
        try {
            const settings = await this.resolveBackupSettings();

            if (settings.lastBackupStatus === 'running') {
                return fail(ERRORS.DATABASE_BACKUP_ALREADY_RUNNING);
            }

            await this.markBackupRunning();
            return ok(undefined);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.RUN_DATABASE_BACKUP_ERROR);
        }
    }

    public async resetBackupRunningStatus(errorMessage: string): Promise<void> {
        this.invalidateSettingsCache();
        const settings = await this.getSettings();

        if (settings.lastBackupStatus !== 'running') {
            return;
        }

        await this.persistSettings({
            ...settings,
            lastBackupStatus: 'failed',
            lastBackupError: errorMessage,
        });
    }

    public async loadSettingsCache(): Promise<void> {
        this.cachedSettings = await this.getSettings();
    }

    public async tryScheduleBackup(): Promise<boolean> {
        const settings = await this.resolveBackupSettings();

        if (!shouldRunScheduledBackup(settings)) {
            return false;
        }

        await this.markBackupRunning();
        return true;
    }

    public async executeBackupJob(trigger: 'manual' | 'scheduled' = 'scheduled'): Promise<void> {
        const startedAt = new Date();
        let workDir: string | null = null;

        try {
            const settings = await this.getSettings();
            const archiveRoute = this.telegramRoutesService.resolveRoute('backup');
            const secretsRoute = this.telegramRoutesService.resolveRoute('backupSecrets');

            if (!archiveRoute || !secretsRoute) {
                throw new Error('Telegram backup routes are not configured');
            }

            if (!this.telegramApiService) {
                throw new Error('Telegram notifications are not enabled');
            }

            workDir = join(tmpdir(), `remnawave-backup-${randomUUID()}`);
            await fs.mkdir(workDir, { recursive: true });

            const timestamp = startedAt.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `remnawave-backup-${timestamp}.7z`;
            const dumpPath = join(workDir, 'database.dump');
            const restorePath = join(workDir, 'RESTORE.md');
            const manifestPath = join(workDir, 'manifest.json');
            const archivePath = join(workDir, fileName);
            const password = generateBackupPassword();

            const backupStorageDir = this.configService.get('DATABASE_BACKUP_DIR')?.trim() || null;

            await this.runPgDump(dumpPath);
            await fs.writeFile(restorePath, buildRestoreInstructions(backupStorageDir), 'utf8');
            await fs.writeFile(
                manifestPath,
                JSON.stringify(
                    {
                        createdAt: startedAt.toISOString(),
                        trigger,
                        panelVersion: process.env.__RW_METADATA_VERSION ?? null,
                        format: 'pg_dump-custom',
                        archiveFormat: '7z',
                    },
                    null,
                    2,
                ),
                'utf8',
            );

            await this.createPasswordProtectedArchive({
                archivePath,
                password,
                files: [dumpPath, restorePath, manifestPath],
            });

            const stats = await fs.stat(archivePath);

            if (backupStorageDir) {
                await this.persistArchiveToVolume(backupStorageDir, archivePath, fileName);
            }

            if (stats.size > TELEGRAM_MAX_FILE_BYTES) {
                throw new Error(
                    `Backup archive is ${(stats.size / (1024 * 1024)).toFixed(2)} MB — exceeds Telegram 50 MB limit`,
                );
            }

            await this.telegramApiService.sendDocument(archiveRoute.chatId, archivePath, {
                threadId: archiveRoute.threadId ? parseInt(archiveRoute.threadId, 10) : undefined,
                caption: buildBackupArchiveTelegramCaption({
                    fileName,
                    createdAt: startedAt,
                    sizeBytes: stats.size,
                }),
            });

            await this.telegramQueue?.addJobToSendTelegramMessage({
                chatId: secretsRoute.chatId,
                threadId: secretsRoute.threadId,
                message: buildBackupPasswordTelegramMessage({
                    fileName,
                    createdAt: startedAt,
                    password,
                    sizeBytes: stats.size,
                }),
            });

            if (settings.notifyOnSuccess) {
                const serviceRoute = this.telegramRoutesService.resolveRoute('service');
                if (serviceRoute) {
                    await this.telegramQueue?.addJobToSendTelegramMessage({
                        chatId: serviceRoute.chatId,
                        threadId: serviceRoute.threadId,
                        message: buildBackupSuccessTelegramMessage({
                            fileName,
                            createdAt: startedAt,
                            sizeBytes: stats.size,
                        }),
                    });
                }
            }

            const completedAt = new Date();
            const nextScheduledBackupAt = computeNextScheduledBackupAt(settings, completedAt);

            await this.persistSettings({
                ...settings,
                lastBackupAt: completedAt.toISOString(),
                lastBackupStatus: 'success',
                lastBackupError: null,
                lastBackupSizeBytes: stats.size,
                lastBackupFileName: fileName,
                nextScheduledBackupAt: nextScheduledBackupAt?.toISOString() ?? null,
            });

            this.logger.log(`Database backup completed: ${fileName} (${stats.size} bytes)`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Database backup failed: ${message}`);
            await this.markBackupFailed(startedAt, message);
        } finally {
            if (workDir) {
                await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
            }
        }
    }

    private async markBackupRunning(): Promise<void> {
        const settings = await this.getSettings();
        const startedAt = new Date().toISOString();

        await this.persistSettings({
            ...settings,
            lastBackupStatus: 'running',
            lastBackupError: null,
            lastBackupAt: startedAt,
        });
    }

    private async markBackupFailed(startedAt: Date, message: string): Promise<void> {
        this.invalidateSettingsCache();
        const settings = await this.getSettings();

        if (settings.notifyOnFailure) {
            try {
                const serviceRoute = this.telegramRoutesService.resolveRoute('service');
                if (serviceRoute) {
                    await this.telegramQueue?.addJobToSendTelegramMessage({
                        chatId: serviceRoute.chatId,
                        threadId: serviceRoute.threadId,
                        message: buildBackupFailureTelegramMessage({
                            error: message,
                            createdAt: startedAt,
                        }),
                    });
                }
            } catch (notifyError) {
                this.logger.warn(
                    `Failed to enqueue database backup failure notification: ${notifyError}`,
                );
            }
        }

        try {
            await this.persistSettings({
                ...settings,
                lastBackupAt: startedAt.toISOString(),
                lastBackupStatus: 'failed',
                lastBackupError: message,
                lastBackupSizeBytes: null,
                lastBackupFileName: null,
                nextScheduledBackupAt: resolveDatabaseBackupCronExpression(settings)
                    ? computeNextScheduledBackupAt(settings, startedAt)?.toISOString() ?? null
                    : null,
            });
        } catch (persistError) {
            this.logger.error(`Failed to persist database backup failure status: ${persistError}`);
        }
    }

    private async resolveBackupSettings(): Promise<TDatabaseBackupSettings> {
        this.invalidateSettingsCache();
        const settings = await this.getSettings();

        if (!isStaleRunningBackup(settings)) {
            return settings;
        }

        this.logger.warn('Clearing stale database backup running state');

        const cleared: TDatabaseBackupSettings = {
            ...settings,
            lastBackupStatus: 'failed',
            lastBackupError: 'Previous backup did not complete (stale running state cleared)',
        };

        await this.persistSettings(cleared);
        return cleared;
    }

    private invalidateSettingsCache(): void {
        this.cachedSettings = null;
    }

    private async persistArchiveToVolume(
        storageDir: string,
        archivePath: string,
        fileName: string,
    ): Promise<void> {
        await fs.mkdir(storageDir, { recursive: true });
        const destinationPath = join(storageDir, fileName);

        await fs.copyFile(archivePath, destinationPath);
        await this.pruneStoredBackups(storageDir);
        this.logger.log(`Database backup stored locally: ${destinationPath}`);
    }

    private async pruneStoredBackups(storageDir: string): Promise<void> {
        const retention = this.configService.get('DATABASE_BACKUP_RETENTION_COUNT');
        const entries = await fs.readdir(storageDir);
        const archives = (
            await Promise.all(
                entries
                    .filter((name) => name.startsWith('remnawave-backup-') && name.endsWith('.7z'))
                    .map(async (name) => ({
                        name,
                        mtimeMs: (await fs.stat(join(storageDir, name))).mtimeMs,
                    })),
            )
        ).sort((left, right) => right.mtimeMs - left.mtimeMs);

        for (const entry of archives.slice(retention)) {
            await fs.rm(join(storageDir, entry.name), { force: true }).catch(() => undefined);
        }
    }

    private async runPgDump(outputPath: string): Promise<void> {
        const databaseUrl = this.configService.getOrThrow('DATABASE_URL');

        await execFileAsync(
            'pg_dump',
            ['--format=custom', '--no-owner', '--no-acl', '--file', outputPath, databaseUrl],
            {
                env: process.env,
                maxBuffer: 1024 * 1024 * 256,
            },
        );
    }

    private async createPasswordProtectedArchive(params: {
        archivePath: string;
        password: string;
        files: string[];
    }): Promise<void> {
        await execFileAsync(
            '7z',
            ['a', '-t7z', '-mhe=on', `-p${params.password}`, params.archivePath, ...params.files],
            {
                env: process.env,
                maxBuffer: 1024 * 1024 * 64,
            },
        );
    }

    private async getSettings(): Promise<TDatabaseBackupSettings> {
        if (this.cachedSettings) {
            return this.cachedSettings;
        }

        const entity = await this.remnawaveSettingsRepository.getSettings();
        const parsed = DatabaseBackupSettingsSchema.safeParse(
            entity.databaseBackupSettings ?? DEFAULT_DATABASE_BACKUP_SETTINGS,
        );

        this.cachedSettings = parsed.success ? parsed.data : DEFAULT_DATABASE_BACKUP_SETTINGS;
        return this.cachedSettings;
    }

    private async persistSettings(settings: TDatabaseBackupSettings): Promise<void> {
        await this.remnawaveSettingsRepository.update({
            databaseBackupSettings: settings,
        });
        this.cachedSettings = settings;
        await this.rawCacheService.del(CACHE_KEYS.REMNAWAVE_SETTINGS);
    }
}
