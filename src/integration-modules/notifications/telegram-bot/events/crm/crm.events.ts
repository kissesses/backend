import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NotificationsConfigService } from '@common/config/common-config';
import { TCRMEvents } from '@libs/contracts/constants';

import { CrmEvent } from '@integration-modules/notifications/interfaces';

import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import { CRM_EVENTS_TEMPLATES, CrmEventsTemplate } from './crm.events.templates';

@Injectable()
export class CrmEvents implements OnApplicationBootstrap {
    private readonly logger = new Logger(CrmEvents.name);

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly notificationsConfig: NotificationsConfigService,
        private readonly telegramQueue: TelegramBotLoggerQueueService,
        private readonly telegramRoutesService: TelegramNotificationRoutesService,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        await this.telegramRoutesService.loadSettingsCache();
        this.registerEnabledListeners();
    }

    private registerEnabledListeners(): void {
        for (const [eventName, template] of Object.entries(CRM_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TCRMEvents, 'telegram')) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }

            this.eventEmitter.on(eventName, (event: CrmEvent) => this.handleEvent(event, template));
        }
    }

    private async handleEvent(event: CrmEvent, template: CrmEventsTemplate): Promise<void> {
        const route = this.telegramRoutesService.resolveRoute('crm');
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
