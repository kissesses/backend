import { Injectable, Logger } from '@nestjs/common';

import { USER_ACTIVITY_EXTRA_EVENTS } from '@libs/contracts/constants';

import {
    UserEvent,
    UserHwidDeviceEvent,
} from '@integration-modules/notifications/interfaces';

import { UserActivityEventEntity } from './entities';
import { UserActivityTimelineService } from './user-activity-timeline.service';

@Injectable()
export class UserActivityTimelineWriterService {
    private readonly logger = new Logger(UserActivityTimelineWriterService.name);

    constructor(private readonly userActivityTimelineService: UserActivityTimelineService) {}

    public async recordUserEvent(event: UserEvent): Promise<void> {
        try {
            const metadata = event.meta ? { ...event.meta } : null;
            const nodeUuid = event.user.userTraffic?.lastConnectedNodeUuid ?? null;

            await this.userActivityTimelineService.createEvent(
                new UserActivityEventEntity({
                    userId: event.user.tId,
                    eventType: event.eventName,
                    metadata,
                    nodeUuid,
                    occurredAt: new Date(),
                }),
            );
        } catch (error) {
            this.logger.error(`Failed to record user event ${event.eventName}: ${error}`);
        }
    }

    public async recordHwidEvent(event: UserHwidDeviceEvent): Promise<void> {
        try {
            const { user, hwidUserDevice } = event.data;

            await this.userActivityTimelineService.createEvent(
                new UserActivityEventEntity({
                    userId: user.tId,
                    eventType: event.eventName,
                    metadata: {
                        hwid: hwidUserDevice.hwid,
                        platform: hwidUserDevice.platform,
                        osVersion: hwidUserDevice.osVersion,
                        deviceModel: hwidUserDevice.deviceModel,
                    },
                    requestIp: hwidUserDevice.requestIp,
                    userAgent: hwidUserDevice.userAgent,
                    occurredAt: new Date(),
                }),
            );
        } catch (error) {
            this.logger.error(`Failed to record HWID event ${event.eventName}: ${error}`);
        }
    }

    public async recordSubscriptionRequest(payload: {
        userId: bigint;
        requestIp: string | null;
        userAgent: string | null;
        occurredAt: Date;
    }): Promise<void> {
        try {
            await this.userActivityTimelineService.createEvent(
                new UserActivityEventEntity({
                    userId: payload.userId,
                    eventType: USER_ACTIVITY_EXTRA_EVENTS.SUBSCRIPTION_REQUEST,
                    requestIp: payload.requestIp,
                    userAgent: payload.userAgent,
                    occurredAt: payload.occurredAt,
                }),
            );
        } catch (error) {
            this.logger.error(`Failed to record subscription request event: ${error}`);
        }
    }
}
