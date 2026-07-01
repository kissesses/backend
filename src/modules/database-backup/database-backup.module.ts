import { Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { TelegramApiModule } from '@integration-modules/notifications/telegram-bot/telegram-api.module';

import { RemnawaveSettingsModule } from '@modules/remnawave-settings/remnawave-settings.module';
import { TelegramNotificationRoutesModule } from '@modules/telegram-notification-routes/telegram-notification-routes.module';

import { DatabaseBackupService } from './database-backup.service';

@Module({
    imports: [
        CqrsModule,
        RemnawaveSettingsModule,
        TelegramNotificationRoutesModule,
        ConditionalModule.registerWhen(TelegramApiModule, 'IS_TELEGRAM_NOTIFICATIONS_ENABLED'),
    ],
    providers: [DatabaseBackupService],
    exports: [DatabaseBackupService],
})
export class DatabaseBackupModule {}
