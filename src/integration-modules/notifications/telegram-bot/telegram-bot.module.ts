import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RemnawaveSettingsModule } from '@modules/remnawave-settings/remnawave-settings.module';
import { TelegramNotificationRoutesModule } from '@modules/telegram-notification-routes/telegram-notification-routes.module';

import { TELEGRAM_BOT_EVENTS } from './events';
import { TelegramApiModule } from './telegram-api.module';
import { TelegramRoutesBootstrapService } from './telegram-routes-bootstrap.service';

@Module({
    imports: [ConfigModule, TelegramApiModule, TelegramNotificationRoutesModule, RemnawaveSettingsModule],
    controllers: [],
    providers: [TelegramRoutesBootstrapService, ...TELEGRAM_BOT_EVENTS],
    exports: [TelegramApiModule],
})
export class TelegramBotModule {}
