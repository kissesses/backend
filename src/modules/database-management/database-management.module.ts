import { Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { TelegramApiModule } from '@integration-modules/notifications/telegram-bot/telegram-api.module';

import { DatabaseManagementElevationGuard } from '@common/guards/database-management-elevation/database-management-elevation.guard';

import { RemnawaveSettingsModule } from '@modules/remnawave-settings/remnawave-settings.module';
import { TelegramNotificationRoutesModule } from '@modules/telegram-notification-routes/telegram-notification-routes.module';

import { DatabaseManagementGateService } from './database-management-gate.service';

@Module({
    imports: [
        CqrsModule,
        RemnawaveSettingsModule,
        TelegramNotificationRoutesModule,
        ConditionalModule.registerWhen(TelegramApiModule, 'IS_TELEGRAM_NOTIFICATIONS_ENABLED'),
    ],
    providers: [DatabaseManagementGateService, DatabaseManagementElevationGuard],
    exports: [DatabaseManagementGateService, DatabaseManagementElevationGuard],
})
export class DatabaseManagementModule {}
