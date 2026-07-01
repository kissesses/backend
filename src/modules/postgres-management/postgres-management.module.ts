import { Module } from '@nestjs/common';
import { ConditionalModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { PrismaModule } from '@common/database/prisma.module';
import { PostgresManagementElevationGuard } from '@common/guards/postgres-management-elevation/postgres-management-elevation.guard';

import { TelegramApiModule } from '@integration-modules/notifications/telegram-bot/telegram-api.module';

import { RemnawaveSettingsModule } from '@modules/remnawave-settings/remnawave-settings.module';
import { TelegramNotificationRoutesModule } from '@modules/telegram-notification-routes/telegram-notification-routes.module';

import { PostgresManagementGateService } from './postgres-management-gate.service';
import { PostgresSqlService } from './postgres-sql.service';

@Module({
    imports: [
        CqrsModule,
        PrismaModule,
        RemnawaveSettingsModule,
        TelegramNotificationRoutesModule,
        ConditionalModule.registerWhen(TelegramApiModule, 'IS_TELEGRAM_NOTIFICATIONS_ENABLED'),
    ],
    providers: [
        PostgresManagementGateService,
        PostgresSqlService,
        PostgresManagementElevationGuard,
    ],
    exports: [
        PostgresManagementGateService,
        PostgresSqlService,
        PostgresManagementElevationGuard,
    ],
})
export class PostgresManagementModule {}
