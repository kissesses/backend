import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { TypedConfigService } from '@common/config/app-config';
import { RawCacheService } from '@common/raw-cache';
import { fail, ok, TResult } from '@common/types';
import { CACHE_KEYS, ERRORS } from '@libs/contracts/constants';
import {
    DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS,
    getTelegramTopicIdField,
    TELEGRAM_FORUM_TOPIC_NAMES,
    TELEGRAM_NOTIFICATION_ROUTE_CATEGORIES,
    TelegramNotificationSettingsSchema,
    TTelegramNotificationRouteCategory,
    TTelegramNotificationSettings,
} from '@libs/contracts/models';

import { TelegramApiService } from '@integration-modules/notifications/telegram-bot/telegram-api.service';

import { RemnawaveSettingsRepository } from '@modules/remnawave-settings/repositories/remnawave-settings.repository';

const LEGACY_NOTIFY_ENV_KEYS: Record<TTelegramNotificationRouteCategory, string | null> = {
    users: 'TELEGRAM_NOTIFY_USERS',
    nodes: 'TELEGRAM_NOTIFY_NODES',
    crm: 'TELEGRAM_NOTIFY_CRM',
    service: 'TELEGRAM_NOTIFY_SERVICE',
    tblocker: 'TELEGRAM_NOTIFY_TBLOCKER',
    backup: null,
    backupSecrets: null,
};

export type TelegramNotificationRoute = {
    chatId: string;
    threadId?: string;
};

@Injectable()
export class TelegramNotificationRoutesService {
    private readonly logger = new Logger(TelegramNotificationRoutesService.name);
    private cachedSettings: TTelegramNotificationSettings | null = null;

    constructor(
        private readonly remnawaveSettingsRepository: RemnawaveSettingsRepository,
        private readonly configService: TypedConfigService,
        private readonly rawCacheService: RawCacheService,
        @Optional() private readonly telegramApiService?: TelegramApiService,
    ) {}

    public async getSettingsFromController(): Promise<TResult<TTelegramNotificationSettings>> {
        try {
            return ok(await this.getSettings());
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_TELEGRAM_NOTIFICATION_ROUTES_ERROR);
        }
    }

    public async updateSettingsFromController(
        body: TTelegramNotificationSettings,
    ): Promise<TResult<TTelegramNotificationSettings>> {
        try {
            const parsed = TelegramNotificationSettingsSchema.parse(body);
            await this.persistSettings(parsed);
            return ok(parsed);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.UPDATE_TELEGRAM_NOTIFICATION_ROUTES_ERROR);
        }
    }

    public async createTopicsFromController(): Promise<TResult<TTelegramNotificationSettings>> {
        try {
            if (!this.telegramApiService) {
                return fail(ERRORS.TELEGRAM_NOTIFICATIONS_NOT_ENABLED);
            }

            const current = await this.getSettings();
            const chatId = current.chatId ?? this.configService.get('TELEGRAM_CHAT_ID') ?? null;

            if (!chatId) {
                return fail(ERRORS.TELEGRAM_NOTIFICATION_ROUTES_CHAT_ID_REQUIRED);
            }

            const updated = await this.ensureMissingTopics(chatId, current);
            return ok(updated);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_TELEGRAM_NOTIFICATION_TOPICS_ERROR);
        }
    }

    public async bootstrapFromEnvChatId(): Promise<void> {
        const envChatId = this.configService.get('TELEGRAM_CHAT_ID');
        if (!envChatId || !this.telegramApiService) {
            return;
        }

        const current = await this.getSettings();
        await this.ensureMissingTopics(envChatId, current);
    }

    public isBackupSecretsTopicConfigured(): boolean {
        const settings = this.cachedSettings;

        if (!settings?.chatId || typeof settings.backupSecretsTopicId !== 'number') {
            return false;
        }

        return Boolean(this.resolveRoute('backupSecrets')?.chatId);
    }

    public resolveRoute(category: TTelegramNotificationRouteCategory): TelegramNotificationRoute | null {
        const settings = this.cachedSettings;

        if (settings?.chatId) {
            const topicField = getTelegramTopicIdField(category);
            const topicId = settings[topicField];

            if (typeof topicId === 'number') {
                return {
                    chatId: settings.chatId,
                    threadId: String(topicId),
                };
            }

            return { chatId: settings.chatId };
        }

        const legacyKey = LEGACY_NOTIFY_ENV_KEYS[category];
        if (!legacyKey) {
            return null;
        }

        const legacyValue = this.configService.get(legacyKey as 'TELEGRAM_NOTIFY_USERS');

        if (typeof legacyValue === 'string' && legacyValue && legacyValue !== 'change_me') {
            const [chatId, threadId] = legacyValue.split(':');
            if (chatId) {
                return threadId ? { chatId, threadId } : { chatId };
            }
        }

        return null;
    }

    public async loadSettingsCache(): Promise<void> {
        this.cachedSettings = await this.getSettings();
    }

    private async getSettings(): Promise<TTelegramNotificationSettings> {
        if (this.cachedSettings) {
            return this.cachedSettings;
        }

        const entity = await this.remnawaveSettingsRepository.getSettings();
        const parsed = TelegramNotificationSettingsSchema.safeParse(
            entity.telegramNotificationSettings ?? DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS,
        );

        this.cachedSettings = parsed.success
            ? parsed.data
            : DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS;

        return this.cachedSettings;
    }

    private async persistSettings(settings: TTelegramNotificationSettings): Promise<void> {
        await this.remnawaveSettingsRepository.update({
            telegramNotificationSettings: settings,
        });
        this.cachedSettings = settings;
        await this.rawCacheService.del(CACHE_KEYS.REMNAWAVE_SETTINGS);
    }

    private async ensureMissingTopics(
        chatId: string,
        current: TTelegramNotificationSettings,
    ): Promise<TTelegramNotificationSettings> {
        if (!this.telegramApiService) {
            return current;
        }

        const next: TTelegramNotificationSettings = {
            ...current,
            chatId: current.chatId ?? chatId,
        };

        for (const category of TELEGRAM_NOTIFICATION_ROUTE_CATEGORIES) {
            const topicField = getTelegramTopicIdField(category);
            const existingTopicId = next[topicField];

            if (typeof existingTopicId === 'number') {
                continue;
            }

            const topicId = await this.telegramApiService.createForumTopic(
                next.chatId!,
                TELEGRAM_FORUM_TOPIC_NAMES[category],
            );

            (next as Record<string, unknown>)[topicField] = topicId;
        }

        await this.persistSettings(next);
        this.logger.log(`Telegram notification forum topics ensured for chat ${next.chatId}`);

        return next;
    }
}
