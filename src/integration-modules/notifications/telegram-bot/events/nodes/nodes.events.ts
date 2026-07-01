import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NotificationsConfigService } from '@common/config/common-config';
import { TNodeEvents } from '@libs/contracts/constants';

import { NodeEvent } from '@integration-modules/notifications/interfaces';

import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

import { TelegramBotLoggerQueueService } from '@queue/notifications/telegram-bot-logger';

import { NODES_EVENTS_TEMPLATES, NodesEventsTemplate } from './nodes.events.templates';

@Injectable()
export class NodesEvents implements OnApplicationBootstrap {
    private readonly logger = new Logger(NodesEvents.name);

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
        for (const [eventName, template] of Object.entries(NODES_EVENTS_TEMPLATES)) {
            if (!this.notificationsConfig.isEnabled(eventName as TNodeEvents, 'telegram')) {
                this.logger.debug(`Event "${eventName}" is not enabled for Telegram`);
                continue;
            }

            this.eventEmitter.on(eventName, (event: NodeEvent) =>
                this.handleEvent(event, template),
            );
        }
    }

    private async handleEvent(event: NodeEvent, template: NodesEventsTemplate): Promise<void> {
        const route = this.telegramRoutesService.resolveRoute('nodes');
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
