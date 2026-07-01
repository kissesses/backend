import { promises as fs } from 'node:fs';
import { join } from 'node:path';

import { Injectable, Logger, Optional } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { TypedConfigService } from '@common/config/app-config';
import {
    DATABASE_MANAGEMENT_ELEVATION_GATE_CONFIG,
    ManagementElevationGateService,
} from '@common/management-elevation-gate';
import { RawCacheService } from '@common/raw-cache';
import { fail, ok, TResult } from '@common/types';
import { GetDatabaseManagementArchivesCommand } from '@libs/contracts/commands';
import { ERRORS } from '@libs/contracts/constants/errors';

import { TelegramApiService } from '@integration-modules/notifications/telegram-bot/telegram-api.service';

import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger/telegram-bot-logger.service';

@Injectable()
export class DatabaseManagementGateService extends ManagementElevationGateService {
    private readonly archivesLogger = new Logger(DatabaseManagementGateService.name);

    constructor(
        rawCacheService: RawCacheService,
        queryBus: QueryBus,
        commandBus: CommandBus,
        configService: TypedConfigService,
        telegramRoutesService: TelegramNotificationRoutesService,
        @Optional() telegramQueue?: TelegramBotLoggerQueueService,
        @Optional() telegramApiService?: TelegramApiService,
    ) {
        super(
            rawCacheService,
            queryBus,
            commandBus,
            configService,
            telegramRoutesService,
            DATABASE_MANAGEMENT_ELEVATION_GATE_CONFIG,
            telegramQueue,
            telegramApiService,
        );
    }

    public async listArchives(): Promise<
        TResult<GetDatabaseManagementArchivesCommand.Response['response']>
    > {
        try {
            const storageDir = this.configService.get('DATABASE_BACKUP_DIR')?.trim() || null;

            if (!storageDir) {
                return ok({ storageDir: null, archives: [] });
            }

            let entries: string[] = [];

            try {
                entries = await fs.readdir(storageDir);
            } catch {
                return ok({ storageDir, archives: [] });
            }

            const archives = (
                await Promise.all(
                    entries
                        .filter((name) => name.endsWith('.7z'))
                        .map(async (fileName) => {
                            const filePath = join(storageDir, fileName);
                            const stats = await fs.stat(filePath);

                            if (!stats.isFile()) {
                                return null;
                            }

                            return {
                                fileName,
                                sizeBytes: stats.size,
                                createdAt: stats.mtime.toISOString(),
                            };
                        }),
                )
            )
                .filter((item): item is NonNullable<typeof item> => item !== null)
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

            return ok({ storageDir, archives });
        } catch (error) {
            this.archivesLogger.error(error);
            return fail(ERRORS.GET_DATABASE_MANAGEMENT_ARCHIVES_ERROR);
        }
    }
}
