import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NotificationsConfigService } from '@common/config/common-config';
import { EVENTS, TServiceEvents, TErrorsEvents } from '@libs/contracts/constants';

import { ServiceEvent, CustomErrorEvent } from '@integration-modules/notifications/interfaces';

import { RemnawaveSettingsRepository } from '@modules/remnawave-settings/repositories/remnawave-settings.repository';
import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import { buildPanelStartedTelegramNotification } from './panel-started-notification.template';
import {
    SERVICE_EVENTS_TEMPLATES,
    ERRORS_EVENTS_TEMPLATES,
    ServiceEventsTemplate,
    ErrorsEventsTemplate,
} from './service.events.templates';

@Injectable()
export class ServiceEvents implements OnApplicationBootstrap {
    private readonly logger = new Logger(ServiceEvents.name);

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly notificationsConfig: NotificationsConfigService,
        private readonly telegramQueue: TelegramBotLoggerQueueService,
        private readonly telegramRoutesService: TelegramNotificationRoutesService,
        private readonly remnawaveSettingsRepository: RemnawaveSettingsRepository,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        await this.telegramRoutesService.loadSettingsCache();
        this.registerEnabledListeners();
    }

    private registerEnabledListeners(): void {
        for (const [eventName, template] of Object.entries(SERVICE_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TServiceEvents, 'telegram')) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }

            this.eventEmitter.on(eventName, (event: ServiceEvent) =>
                this.handleServiceEvent(event, template),
            );
        }

        for (const [eventName, template] of Object.entries(ERRORS_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TErrorsEvents, 'telegram')) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }

            this.eventEmitter.on(eventName, (event: CustomErrorEvent) =>
                this.handleErrorEvent(event, template),
            );
        }
    }

    private async handleServiceEvent(
        event: ServiceEvent,
        template: ServiceEventsTemplate,
    ): Promise<void> {
        const route = this.telegramRoutesService.resolveRoute('service');
        if (!route) return;

        const message =
            event.eventName === EVENTS.SERVICE.PANEL_STARTED
                ? buildPanelStartedTelegramNotification(
                      event.data.panelVersion ?? '',
                      (await this.remnawaveSettingsRepository.getSettings())
                          .panelStartedNotificationSettings,
                  )
                : template(event);
        if (!message) return;

        await this.telegramQueue.addJobToSendTelegramMessage({
            message: message.message,
            keyboard: message.keyboard,
            chatId: route.chatId,
            threadId: route.threadId,
        });
    }

    private async handleErrorEvent(
        event: CustomErrorEvent,
        template: ErrorsEventsTemplate,
    ): Promise<void> {
        const route = this.telegramRoutesService.resolveRoute('service');
        if (!route) return;

        const message = template(event);
        if (!message) return;

        await this.telegramQueue.addJobToSendTelegramMessage({
            message,
            chatId: route.chatId,
            threadId: route.threadId,
        });
    }
}
