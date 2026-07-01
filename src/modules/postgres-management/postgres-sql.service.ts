import { randomInt, randomUUID, timingSafeEqual } from 'node:crypto';

import { Injectable, Logger, Optional } from '@nestjs/common';

import { PrismaService } from '@common/database/prisma.service';
import { RawCacheService } from '@common/raw-cache';
import { fail, ok, TResult } from '@common/types';
import { ERRORS } from '@libs/contracts/constants/errors';
import {
    AnalyzePostgresQueryCommand,
    ExecutePostgresQueryCommand,
    GetPostgresTablesCommand,
    RequestPostgresQueryConfirmationCommand,
    VerifyPostgresQueryConfirmationCommand,
} from '@libs/contracts/commands';

import { TelegramApiService } from '@integration-modules/notifications/telegram-bot/telegram-api.service';

import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger/telegram-bot-logger.service';

import { analyzeSql, isVacuumQuery, MAX_QUERY_ROWS, QUERY_STATEMENT_TIMEOUT_MS, requiresTelegramConfirmation } from './postgres-sql.utils';
import { serializeSqlRows } from './postgres-sql.serialize';

const CONFIRMATION_TTL_SECONDS = 10 * 60;
const CONFIRMATION_TOKEN_TTL_SECONDS = 5 * 60;
const MAX_CONFIRMATION_ATTEMPTS = 5;

const confirmationPayloadKey = (confirmationId: string) =>
    `postgres-mgmt:confirm-payload:${confirmationId}`;
const confirmationCodeKey = (confirmationId: string) =>
    `postgres-mgmt:confirm-code:${confirmationId}`;
const confirmationAttemptsKey = (confirmationId: string) =>
    `postgres-mgmt:confirm-attempts:${confirmationId}`;
const confirmationTokenKey = (token: string) => `postgres-mgmt:exec-token:${token}`;

interface ConfirmationPayload {
    adminUuid: string;
    sql: string;
    sqlHash: string;
    operation: string;
}

interface ConfirmationTokenPayload {
    adminUuid: string;
    sqlHash: string;
}

@Injectable()
export class PostgresSqlService {
    private readonly logger = new Logger(PostgresSqlService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly rawCacheService: RawCacheService,
        private readonly telegramRoutesService: TelegramNotificationRoutesService,
        @Optional() private readonly telegramQueue?: TelegramBotLoggerQueueService,
        @Optional() private readonly telegramApiService?: TelegramApiService,
    ) {}

    public async analyzeQuery(
        sql: string,
    ): Promise<TResult<AnalyzePostgresQueryCommand.Response['response']>> {
        const analysis = analyzeSql(sql);

        if (analysis.classification === 'forbidden') {
            return fail(ERRORS.POSTGRES_SQL_FORBIDDEN);
        }

        const telegramConfigured = await this.isTelegramConfigured();

        return ok({
            classification: analysis.classification,
            operation: analysis.operation,
            requiresTelegramConfirmation:
                requiresTelegramConfirmation(analysis) && telegramConfigured,
        });
    }

    public async listTables(): Promise<TResult<GetPostgresTablesCommand.Response['response']>> {
        try {
            const rows = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_type = 'BASE TABLE'
                ORDER BY table_name ASC
            `;

            return ok({
                tables: rows.map((row) => row.table_name),
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_POSTGRES_TABLES_ERROR);
        }
    }

    public async requestConfirmation(
        adminUuid: string,
        sql: string,
    ): Promise<TResult<RequestPostgresQueryConfirmationCommand.Response['response']>> {
        try {
            const analysis = analyzeSql(sql);

            if (analysis.classification === 'forbidden') {
                return fail(ERRORS.POSTGRES_SQL_FORBIDDEN);
            }

            if (!requiresTelegramConfirmation(analysis)) {
                return fail(ERRORS.FORBIDDEN);
            }

            if (!(await this.isTelegramConfigured())) {
                return fail(ERRORS.POSTGRES_MANAGEMENT_TELEGRAM_NOT_CONFIGURED);
            }

            await this.telegramRoutesService.loadSettingsCache();
            const route = this.telegramRoutesService.resolveRoute('backupSecrets');

            if (!route?.chatId) {
                return fail(ERRORS.POSTGRES_MANAGEMENT_TELEGRAM_NOT_CONFIGURED);
            }

            const confirmationId = randomUUID();
            const code = String(randomInt(100_000, 1_000_000));
            const payload: ConfirmationPayload = {
                adminUuid,
                sql: analysis.normalizedSql,
                sqlHash: analysis.sqlHash,
                operation: analysis.operation!,
            };

            await this.rawCacheService.set(
                confirmationPayloadKey(confirmationId),
                payload,
                CONFIRMATION_TTL_SECONDS,
            );
            await this.rawCacheService.set(
                confirmationCodeKey(confirmationId),
                code,
                CONFIRMATION_TTL_SECONDS,
            );

            const preview =
                analysis.normalizedSql.length > 500
                    ? `${analysis.normalizedSql.slice(0, 500)}…`
                    : analysis.normalizedSql;

            const message = [
                `⚠️ <b>PostgreSQL ${analysis.operation} confirmation</b>`,
                '',
                'Enter this code in the admin panel to run the query:',
                `<code>${code}</code>`,
                '',
                '<b>Query preview:</b>',
                `<pre>${this.escapeHtml(preview)}</pre>`,
                '',
                `Valid for ${Math.floor(CONFIRMATION_TTL_SECONDS / 60)} minutes.`,
            ].join('\n');

            if (this.telegramQueue) {
                await this.telegramQueue.addJobToSendTelegramMessage({
                    chatId: route.chatId,
                    threadId: route.threadId,
                    message,
                });
            } else if (this.telegramApiService) {
                await this.telegramApiService.sendMessage(route.chatId, message, {
                    threadId: route.threadId ? parseInt(route.threadId, 10) : undefined,
                });
            } else {
                return fail(ERRORS.POSTGRES_MANAGEMENT_TELEGRAM_NOT_CONFIGURED);
            }

            return ok({
                confirmationId,
                operation: analysis.operation!,
                expiresInSeconds: CONFIRMATION_TTL_SECONDS,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.REQUEST_POSTGRES_SQL_CONFIRMATION_ERROR);
        }
    }

    public async verifyConfirmation(
        adminUuid: string,
        confirmationId: string,
        code: string,
    ): Promise<TResult<VerifyPostgresQueryConfirmationCommand.Response['response']>> {
        try {
            const payload = await this.rawCacheService.get<ConfirmationPayload>(
                confirmationPayloadKey(confirmationId),
            );

            if (!payload || payload.adminUuid !== adminUuid) {
                return fail(ERRORS.POSTGRES_SQL_CONFIRMATION_EXPIRED);
            }

            const storedCode = await this.rawCacheService.get<string>(
                confirmationCodeKey(confirmationId),
            );

            if (!storedCode) {
                return fail(ERRORS.POSTGRES_SQL_CONFIRMATION_EXPIRED);
            }

            const attempts =
                (await this.rawCacheService.get<number>(confirmationAttemptsKey(confirmationId))) ??
                0;

            if (attempts >= MAX_CONFIRMATION_ATTEMPTS) {
                await this.clearConfirmation(confirmationId);
                return fail(ERRORS.POSTGRES_SQL_CONFIRMATION_EXPIRED);
            }

            const normalizedInput = code.trim();
            const normalizedStored = storedCode.trim();
            const isMatch =
                normalizedInput.length === normalizedStored.length &&
                timingSafeEqual(Buffer.from(normalizedInput), Buffer.from(normalizedStored));

            if (!isMatch) {
                await this.rawCacheService.set(
                    confirmationAttemptsKey(confirmationId),
                    attempts + 1,
                    CONFIRMATION_TTL_SECONDS,
                );
                return fail(ERRORS.POSTGRES_SQL_CONFIRMATION_INVALID);
            }

            const confirmationToken = randomUUID();
            const tokenPayload: ConfirmationTokenPayload = {
                adminUuid,
                sqlHash: payload.sqlHash,
            };

            await this.rawCacheService.set(
                confirmationTokenKey(confirmationToken),
                tokenPayload,
                CONFIRMATION_TOKEN_TTL_SECONDS,
            );
            await this.clearConfirmation(confirmationId);

            return ok({
                confirmationToken,
                expiresInSeconds: CONFIRMATION_TOKEN_TTL_SECONDS,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.VERIFY_POSTGRES_SQL_CONFIRMATION_ERROR);
        }
    }

    public async executeQuery(
        adminUuid: string,
        sql: string,
        confirmationToken?: string,
    ): Promise<TResult<ExecutePostgresQueryCommand.Response['response']>> {
        try {
            const analysis = analyzeSql(sql);

            if (analysis.classification === 'forbidden') {
                return fail(ERRORS.POSTGRES_SQL_FORBIDDEN);
            }

            if (requiresTelegramConfirmation(analysis)) {
                if (!(await this.isTelegramConfigured())) {
                    return fail(ERRORS.POSTGRES_MANAGEMENT_TELEGRAM_NOT_CONFIGURED);
                }

                if (!confirmationToken) {
                    return fail(ERRORS.POSTGRES_SQL_CONFIRMATION_REQUIRED);
                }

                const tokenPayload = await this.rawCacheService.get<ConfirmationTokenPayload>(
                    confirmationTokenKey(confirmationToken),
                );

                if (
                    !tokenPayload ||
                    tokenPayload.adminUuid !== adminUuid ||
                    tokenPayload.sqlHash !== analysis.sqlHash
                ) {
                    return fail(ERRORS.POSTGRES_SQL_CONFIRMATION_EXPIRED);
                }

                await this.rawCacheService.del(confirmationTokenKey(confirmationToken));
            }

            if (analysis.classification === 'read') {
                const rows = await this.runReadQuery(analysis.normalizedSql);
                const normalizedRows = Array.isArray(rows) ? rows : [];
                const serializedRows = serializeSqlRows(
                    normalizedRows as Record<string, unknown>[],
                );
                const truncated = serializedRows.length > MAX_QUERY_ROWS;
                const limitedRows = truncated
                    ? serializedRows.slice(0, MAX_QUERY_ROWS)
                    : serializedRows;
                const columns =
                    limitedRows.length > 0 ? Object.keys(limitedRows[0] ?? {}) : [];

                this.logQueryExecution(adminUuid, analysis, limitedRows.length);

                return ok({
                    kind: 'rows',
                    columns,
                    rows: limitedRows,
                    rowCount: limitedRows.length,
                    truncated,
                });
            }

            const rowCount = await this.runWriteQuery(analysis);

            this.logQueryExecution(adminUuid, analysis, Number(rowCount));

            return ok({
                kind: 'command',
                rowCount: Number(rowCount),
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.EXECUTE_POSTGRES_SQL_ERROR);
        }
    }

    private async isTelegramConfigured(): Promise<boolean> {
        if (!this.telegramApiService && !this.telegramQueue) {
            return false;
        }

        await this.telegramRoutesService.loadSettingsCache();

        return this.telegramRoutesService.isBackupSecretsTopicConfigured();
    }

    private async runReadQuery(sql: string): Promise<unknown[]> {
        return this.prisma.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(
                `SET LOCAL statement_timeout = ${QUERY_STATEMENT_TIMEOUT_MS}`,
            );
            const result = await tx.$queryRawUnsafe<unknown[]>(sql);
            return Array.isArray(result) ? result : [];
        });
    }

    private async runWriteQuery(analysis: ReturnType<typeof analyzeSql>): Promise<number> {
        if (isVacuumQuery(analysis)) {
            await this.prisma.$executeRawUnsafe(
                `SET statement_timeout = ${QUERY_STATEMENT_TIMEOUT_MS}`,
            );

            try {
                return Number(await this.prisma.$executeRawUnsafe(analysis.normalizedSql));
            } finally {
                await this.prisma.$executeRawUnsafe('RESET statement_timeout');
            }
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(
                `SET LOCAL statement_timeout = ${QUERY_STATEMENT_TIMEOUT_MS}`,
            );
            return Number(await tx.$executeRawUnsafe(analysis.normalizedSql));
        });
    }

    private async clearConfirmation(confirmationId: string): Promise<void> {
        await this.rawCacheService.del(confirmationPayloadKey(confirmationId));
        await this.rawCacheService.del(confirmationCodeKey(confirmationId));
        await this.rawCacheService.del(confirmationAttemptsKey(confirmationId));
    }

    private logQueryExecution(
        adminUuid: string,
        analysis: ReturnType<typeof analyzeSql>,
        rowCount: number,
    ): void {
        this.logger.log(
            `Postgres query executed admin=${adminUuid} classification=${analysis.classification} operation=${analysis.operation ?? 'none'} sqlHash=${analysis.sqlHash} rowCount=${rowCount}`,
        );
    }

    private escapeHtml(value: string): string {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
    }
}
