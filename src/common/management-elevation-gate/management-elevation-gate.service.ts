import { randomInt, createHmac, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import {
    AuthenticationResponseJSON,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { TypedConfigService } from '@common/config/app-config';
import { RawCacheService } from '@common/raw-cache';
import { fail, ok, TResult } from '@common/types';
import { OAUTH2_PROVIDERS, ROLE } from '@libs/contracts/constants';
import { ERRORS } from '@libs/contracts/constants/errors';

import { TelegramApiService } from '@integration-modules/notifications/telegram-bot/telegram-api.service';

import { FindPasskeyByIdAndAdminUuidQuery } from '@modules/admin/queries/find-passkey-by-id-and-uuid';
import { UpdatePasskeyCommand } from '@modules/admin/commands/update-passkey';
import { GetAdminByUuidQuery } from '@modules/admin/queries/get-admin-by-uuid';
import { GetPasskeysByAdminUuidQuery } from '@modules/admin/queries/get-passkeys-by-admin-uuid';
import { GetCachedRemnawaveSettingsQuery } from '@modules/remnawave-settings/queries/get-cached-remnawave-settings';
import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger/telegram-bot-logger.service';

import {
    CODE_TTL_SECONDS,
    createManagementElevationCacheKeys,
    ELEVATION_TTL_SECONDS,
    ManagementElevationCacheKeys,
    ManagementElevationGateConfig,
    ManagementGateAlternativeMethods,
    ManagementGateStatus,
    MAX_CODE_ATTEMPTS,
    PASSKEY_CHALLENGE_TTL_SECONDS,
} from './management-elevation-gate.types';

const scryptAsync = promisify(scrypt);

export class ManagementElevationGateService {
    protected readonly logger: Logger;
    protected readonly cacheKeys: ManagementElevationCacheKeys;

    constructor(
        protected readonly rawCacheService: RawCacheService,
        protected readonly queryBus: QueryBus,
        protected readonly commandBus: CommandBus,
        protected readonly configService: TypedConfigService,
        protected readonly telegramRoutesService: TelegramNotificationRoutesService,
        protected readonly gateConfig: ManagementElevationGateConfig,
        protected readonly telegramQueue?: TelegramBotLoggerQueueService,
        protected readonly telegramApiService?: TelegramApiService,
    ) {
        this.logger = new Logger(gateConfig.loggerName);
        this.cacheKeys = createManagementElevationCacheKeys(gateConfig.cachePrefix);
    }

    protected get jwtSecret(): string {
        return this.configService.getOrThrow('JWT_AUTH_SECRET');
    }

    public async tryCompleteOAuthElevation(adminUuid: string): Promise<boolean> {
        await this.telegramRoutesService.loadSettingsCache();

        if (this.isTelegramGateConfigured()) {
            await this.rawCacheService.del(this.cacheKeys.oauthPending(adminUuid));
            return false;
        }

        const pending = await this.rawCacheService.get<boolean>(
            this.cacheKeys.oauthPending(adminUuid),
        );

        if (!pending) {
            return false;
        }

        await this.rawCacheService.del(this.cacheKeys.oauthPending(adminUuid));
        await this.grantElevation(adminUuid, 'oauth');
        return true;
    }

    public async getGateStatus(adminUuid: string): Promise<TResult<ManagementGateStatus>> {
        try {
            await this.telegramRoutesService.loadSettingsCache();
            const telegramConfigured = this.isTelegramGateConfigured();
            const alternativeMethods = telegramConfigured
                ? this.emptyAlternativeMethods()
                : await this.resolveAlternativeMethods();
            const elevatedUntil = await this.getElevatedUntil(adminUuid);

            return ok({
                isElevated: elevatedUntil !== null,
                elevatedUntil,
                authMode: telegramConfigured ? 'telegram' : 'alternative',
                telegramConfigured,
                alternativeMethods,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(this.gateConfig.errors.getGateStatus);
        }
    }

    public async isElevated(adminUuid: string): Promise<boolean> {
        const elevatedUntil = await this.getElevatedUntil(adminUuid);
        return elevatedUntil !== null;
    }

    public async revokeElevation(adminUuid: string): Promise<TResult<{ revoked: boolean }>> {
        await this.rawCacheService.del(this.cacheKeys.elevation(adminUuid));
        return ok({ revoked: true });
    }

    public async requestTelegramCode(
        adminUuid: string,
    ): Promise<TResult<{ sent: boolean; expiresInSeconds: number }>> {
        try {
            if (!this.isTelegramGateConfigured()) {
                return fail(this.gateConfig.errors.telegramNotConfigured);
            }

            await this.telegramRoutesService.loadSettingsCache();
            const route = this.telegramRoutesService.resolveRoute('backupSecrets');

            if (!route?.chatId) {
                return fail(this.gateConfig.errors.telegramNotConfigured);
            }

            const code = String(randomInt(100_000, 1_000_000));
            await this.rawCacheService.set(
                this.cacheKeys.code(adminUuid),
                code,
                CODE_TTL_SECONDS,
            );

            const message = [
                `🔐 <b>${this.gateConfig.telegramMessageTitle}</b>`,
                '',
                'Enter this code in the admin panel:',
                `<code>${code}</code>`,
                '',
                `Valid for ${Math.floor(CODE_TTL_SECONDS / 60)} minutes.`,
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
                return fail(this.gateConfig.errors.telegramNotConfigured);
            }

            return ok({
                sent: true,
                expiresInSeconds: CODE_TTL_SECONDS,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(this.gateConfig.errors.requestCode);
        }
    }

    public async verifyTelegramCode(
        adminUuid: string,
        code: string,
    ): Promise<TResult<{ elevatedUntil: string }>> {
        try {
            const storedCode = await this.rawCacheService.get<string>(
                this.cacheKeys.code(adminUuid),
            );

            if (!storedCode) {
                return fail(this.gateConfig.errors.codeExpired);
            }

            const attempts =
                (await this.rawCacheService.get<number>(
                    this.cacheKeys.codeAttempts(adminUuid),
                )) ?? 0;

            if (attempts >= MAX_CODE_ATTEMPTS) {
                await this.rawCacheService.del(this.cacheKeys.code(adminUuid));
                return fail(this.gateConfig.errors.codeExpired);
            }

            const normalizedInput = code.trim();
            const normalizedStored = storedCode.trim();
            const isMatch =
                normalizedInput.length === normalizedStored.length &&
                timingSafeEqual(Buffer.from(normalizedInput), Buffer.from(normalizedStored));

            if (!isMatch) {
                await this.rawCacheService.set(
                    this.cacheKeys.codeAttempts(adminUuid),
                    attempts + 1,
                    CODE_TTL_SECONDS,
                );
                return fail(this.gateConfig.errors.invalidCode);
            }

            await this.rawCacheService.del(this.cacheKeys.code(adminUuid));
            await this.rawCacheService.del(this.cacheKeys.codeAttempts(adminUuid));
            const elevatedUntil = await this.grantElevation(adminUuid, 'telegram');

            return ok({ elevatedUntil });
        } catch (error) {
            this.logger.error(error);
            return fail(this.gateConfig.errors.verifyCode);
        }
    }

    public async verifyPassword(
        adminUuid: string,
        password: string,
    ): Promise<TResult<{ elevatedUntil: string }>> {
        try {
            if (!(await this.isAlternativeAuthAllowed())) {
                return fail(ERRORS.FORBIDDEN);
            }

            const settings = await this.queryBus.execute(new GetCachedRemnawaveSettingsQuery());

            if (!settings.passwordSettings.enabled) {
                return fail(ERRORS.FORBIDDEN);
            }

            const admin = await this.queryBus.execute(new GetAdminByUuidQuery(adminUuid));

            if (!admin.isOk || admin.response.role !== ROLE.ADMIN) {
                return fail(ERRORS.FORBIDDEN);
            }

            const isValid = await this.comparePassword(password, admin.response.passwordHash);

            if (!isValid) {
                return fail(ERRORS.FORBIDDEN);
            }

            const elevatedUntil = await this.grantElevation(adminUuid, 'password');

            return ok({ elevatedUntil });
        } catch (error) {
            this.logger.error(error);
            return fail(this.gateConfig.errors.verifyPassword);
        }
    }

    public async generatePasskeyOptions(
        adminUuid: string,
    ): Promise<TResult<Record<string, unknown>>> {
        try {
            if (!(await this.isAlternativeAuthAllowed())) {
                return fail(ERRORS.FORBIDDEN);
            }

            const settings = await this.queryBus.execute(new GetCachedRemnawaveSettingsQuery());

            if (!settings.passkeySettings.enabled) {
                return fail(ERRORS.FORBIDDEN);
            }

            const { rpId, origin } = settings.passkeySettings;

            if (!rpId || !origin) {
                return fail(ERRORS.FORBIDDEN);
            }

            const userPasskeys = await this.queryBus.execute(
                new GetPasskeysByAdminUuidQuery(adminUuid),
            );

            if (!userPasskeys.isOk || userPasskeys.response.length === 0) {
                return fail(ERRORS.FORBIDDEN);
            }

            const options = await generateAuthenticationOptions({
                rpID: rpId,
                allowCredentials: userPasskeys.response.map((passkey) => ({
                    id: passkey.id,
                    transports: passkey.getTransports(),
                })),
                userVerification: 'required',
            });

            await this.rawCacheService.set(
                this.cacheKeys.passkeyChallenge(adminUuid),
                options.challenge,
                PASSKEY_CHALLENGE_TTL_SECONDS,
            );

            return ok(options as unknown as Record<string, unknown>);
        } catch (error) {
            this.logger.error(error);
            return fail(this.gateConfig.errors.verifyPasskey);
        }
    }

    public async verifyPasskey(
        adminUuid: string,
        body: { response?: unknown },
    ): Promise<TResult<{ elevatedUntil: string }>> {
        try {
            if (body.response === undefined) {
                return fail(ERRORS.FORBIDDEN);
            }

            if (!(await this.isAlternativeAuthAllowed())) {
                return fail(ERRORS.FORBIDDEN);
            }

            const settings = await this.queryBus.execute(new GetCachedRemnawaveSettingsQuery());

            if (!settings.passkeySettings.enabled) {
                return fail(ERRORS.FORBIDDEN);
            }

            const { rpId, origin } = settings.passkeySettings;

            if (!rpId || !origin) {
                return fail(ERRORS.FORBIDDEN);
            }

            const expectedChallenge = await this.rawCacheService.get<string>(
                this.cacheKeys.passkeyChallenge(adminUuid),
            );

            if (!expectedChallenge) {
                return fail(ERRORS.FORBIDDEN);
            }

            const authenticationResponse = body.response as AuthenticationResponseJSON;

            const passkey = await this.queryBus.execute(
                new FindPasskeyByIdAndAdminUuidQuery(authenticationResponse.id, adminUuid),
            );

            if (!passkey.isOk) {
                return fail(ERRORS.FORBIDDEN);
            }

            const verification = await verifyAuthenticationResponse({
                response: authenticationResponse,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpId,
                credential: {
                    id: passkey.response.id,
                    publicKey: new Uint8Array(passkey.response.publicKey),
                    counter: Number(passkey.response.counter),
                    transports: passkey.response.getTransports(),
                },
                requireUserVerification: true,
            });

            await this.rawCacheService.del(this.cacheKeys.passkeyChallenge(adminUuid));

            if (!verification.verified) {
                return fail(ERRORS.FORBIDDEN);
            }

            await this.commandBus.execute(
                new UpdatePasskeyCommand(passkey.response.id, {
                    counter: BigInt(verification.authenticationInfo.newCounter),
                    updatedAt: new Date(),
                }),
            );

            const elevatedUntil = await this.grantElevation(adminUuid, 'passkey');

            return ok({ elevatedUntil });
        } catch (error) {
            this.logger.error(error);
            return fail(this.gateConfig.errors.verifyPasskey);
        }
    }

    public async prepareOAuthElevation(
        adminUuid: string,
    ): Promise<TResult<{ prepared: boolean }>> {
        try {
            if (!(await this.isAlternativeAuthAllowed())) {
                return fail(ERRORS.FORBIDDEN);
            }

            const alternativeMethods = await this.resolveAlternativeMethods();
            const hasOAuth2 = Object.values(alternativeMethods.oauth2).some(Boolean);

            if (!hasOAuth2) {
                return fail(ERRORS.FORBIDDEN);
            }

            await this.rawCacheService.set(
                this.cacheKeys.oauthPending(adminUuid),
                true,
                5 * 60,
            );

            return ok({ prepared: true });
        } catch (error) {
            this.logger.error(error);
            return fail(this.gateConfig.errors.prepareOAuth);
        }
    }

    public async confirmOAuthElevation(
        adminUuid: string,
    ): Promise<TResult<{ elevatedUntil: string }>> {
        try {
            const isElevated = await this.isElevated(adminUuid);

            if (isElevated) {
                const elevatedUntil = await this.getElevatedUntil(adminUuid);
                return ok({ elevatedUntil: elevatedUntil! });
            }

            return fail(ERRORS.FORBIDDEN);
        } catch (error) {
            this.logger.error(error);
            return fail(this.gateConfig.errors.confirmOAuth);
        }
    }

    protected async isAlternativeAuthAllowed(): Promise<boolean> {
        await this.telegramRoutesService.loadSettingsCache();
        return !this.isTelegramGateConfigured();
    }

    protected isTelegramGateConfigured(): boolean {
        if (!this.telegramApiService && !this.telegramQueue) {
            return false;
        }

        return this.telegramRoutesService.isBackupSecretsTopicConfigured();
    }

    protected emptyAlternativeMethods(): ManagementGateAlternativeMethods {
        return {
            passkey: false,
            password: false,
            oauth2: {
                [OAUTH2_PROVIDERS.GITHUB]: false,
                [OAUTH2_PROVIDERS.POCKETID]: false,
                [OAUTH2_PROVIDERS.YANDEX]: false,
                [OAUTH2_PROVIDERS.KEYCLOAK]: false,
                [OAUTH2_PROVIDERS.GENERIC]: false,
                [OAUTH2_PROVIDERS.TELEGRAM]: false,
            },
        };
    }

    protected async resolveAlternativeMethods(): Promise<ManagementGateAlternativeMethods> {
        const settings = await this.queryBus.execute(new GetCachedRemnawaveSettingsQuery());

        return {
            passkey: settings.passkeySettings.enabled,
            password: settings.passwordSettings.enabled,
            oauth2: {
                [OAUTH2_PROVIDERS.GITHUB]: settings.oauth2Settings.github.enabled,
                [OAUTH2_PROVIDERS.POCKETID]: settings.oauth2Settings.pocketid.enabled,
                [OAUTH2_PROVIDERS.YANDEX]: settings.oauth2Settings.yandex.enabled,
                [OAUTH2_PROVIDERS.KEYCLOAK]: settings.oauth2Settings.keycloak.enabled,
                [OAUTH2_PROVIDERS.GENERIC]: settings.oauth2Settings.generic.enabled,
                [OAUTH2_PROVIDERS.TELEGRAM]: settings.oauth2Settings.telegram.enabled,
            },
        };
    }

    protected async getElevatedUntil(adminUuid: string): Promise<string | null> {
        const payload = await this.rawCacheService.get<{ until: string }>(
            this.cacheKeys.elevation(adminUuid),
        );

        if (!payload?.until) {
            return null;
        }

        if (new Date(payload.until).getTime() <= Date.now()) {
            await this.rawCacheService.del(this.cacheKeys.elevation(adminUuid));
            return null;
        }

        return payload.until;
    }

    protected async grantElevation(
        adminUuid: string,
        _method: 'telegram' | 'password' | 'passkey' | 'oauth',
    ): Promise<string> {
        const until = new Date(Date.now() + ELEVATION_TTL_SECONDS * 1000).toISOString();

        await this.rawCacheService.set(
            this.cacheKeys.elevation(adminUuid),
            { until },
            ELEVATION_TTL_SECONDS,
        );

        return until;
    }

    protected async comparePassword(plainPassword: string, storedHash: string): Promise<boolean> {
        const hmacResult = createHmac('sha256', this.jwtSecret).update(plainPassword).digest();
        const [salt, hash] = storedHash.split(':');

        if (!salt || !hash) {
            return false;
        }

        const derivedKey = (await scryptAsync(hmacResult.toString('hex'), salt, 64)) as Buffer;
        const calculatedHash = derivedKey.toString('hex');

        if (calculatedHash.length !== hash.length) {
            return false;
        }

        return timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(hash));
    }
}
