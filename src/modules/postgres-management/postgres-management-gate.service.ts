import { Injectable, Optional } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { TypedConfigService } from '@common/config/app-config';
import {
    ManagementElevationGateService,
    POSTGRES_MANAGEMENT_ELEVATION_GATE_CONFIG,
} from '@common/management-elevation-gate';
import { RawCacheService } from '@common/raw-cache';

import { TelegramApiService } from '@integration-modules/notifications/telegram-bot/telegram-api.service';

import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger/telegram-bot-logger.service';

@Injectable()
export class PostgresManagementGateService extends ManagementElevationGateService {
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
            POSTGRES_MANAGEMENT_ELEVATION_GATE_CONFIG,
            telegramQueue,
            telegramApiService,
        );
    }
}
