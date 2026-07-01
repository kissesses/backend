import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { TypedConfigService } from '@common/config/app-config';

import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

@Injectable()
export class TelegramRoutesBootstrapService implements OnApplicationBootstrap {
    private readonly logger = new Logger(TelegramRoutesBootstrapService.name);

    constructor(
        private readonly configService: TypedConfigService,
        private readonly telegramNotificationRoutesService: TelegramNotificationRoutesService,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        if (!this.configService.get('IS_TELEGRAM_NOTIFICATIONS_ENABLED')) {
            return;
        }

        try {
            await this.telegramNotificationRoutesService.loadSettingsCache();
            await this.telegramNotificationRoutesService.bootstrapFromEnvChatId();
        } catch (error) {
            this.logger.error(`Telegram routes bootstrap failed: ${error}`);
        }
    }
}
