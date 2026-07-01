import { Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { TelegramApiModule } from '@integration-modules/notifications/telegram-bot/telegram-api.module';

import { RemnawaveSettingsModule } from '@modules/remnawave-settings/remnawave-settings.module';

import { TelegramNotificationRoutesController } from './telegram-notification-routes.controller';
import { TelegramNotificationRoutesService } from './telegram-notification-routes.service';

@Module({
    imports: [
        CqrsModule,
        RemnawaveSettingsModule,
        ConditionalModule.registerWhen(TelegramApiModule, 'IS_TELEGRAM_NOTIFICATIONS_ENABLED'),
    ],
    controllers: [TelegramNotificationRoutesController],
    providers: [TelegramNotificationRoutesService],
    exports: [TelegramNotificationRoutesService],
})
export class TelegramNotificationRoutesModule {}
