import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EVENTS } from '@libs/contracts/constants';

import {
    UserEvent,
    UserHwidDeviceEvent,
} from '@integration-modules/notifications/interfaces';

import { UserActivityTimelineWriterService } from './user-activity-timeline-writer.service';

@Injectable()
export class UserActivityTimelineEventsListener {
    private readonly logger = new Logger(UserActivityTimelineEventsListener.name);

    constructor(
        private readonly userActivityTimelineWriterService: UserActivityTimelineWriterService,
    ) {}

    @OnEvent(EVENTS.CATCH_ALL_USER_EVENTS)
    async onUserEvent(event: UserEvent): Promise<void> {
        try {
            await this.userActivityTimelineWriterService.recordUserEvent(event);
        } catch (error) {
            this.logger.error(`Error recording user activity event: ${error}`);
        }
    }

    @OnEvent(EVENTS.CATCH_ALL_USER_HWID_DEVICES_EVENTS)
    async onHwidEvent(event: UserHwidDeviceEvent): Promise<void> {
        try {
            await this.userActivityTimelineWriterService.recordHwidEvent(event);
        } catch (error) {
            this.logger.error(`Error recording HWID activity event: ${error}`);
        }
    }
}
