import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { UserActivityTimelineModule } from '@modules/user-activity-timeline';

import { COMMANDS } from './commands';
import { QUERIES } from './queries';
import { UserSubscriptionRequestHistoryRepository } from './repositories/user-subscription-request-history.repository';
import { UserSubscriptionRequestHistoryController } from './user-subscription-request-history.controller';
import { UserSubscriptionRequestHistoryConverter } from './user-subscription-request-history.converter';
import { UserSubscriptionRequestHistoryService } from './user-subscription-request-history.service';

@Module({
    imports: [CqrsModule, UserActivityTimelineModule],
    controllers: [UserSubscriptionRequestHistoryController],
    providers: [
        UserSubscriptionRequestHistoryRepository,
        UserSubscriptionRequestHistoryConverter,
        UserSubscriptionRequestHistoryService,
        ...COMMANDS,
        ...QUERIES,
    ],
})
export class UserSubscriptionRequestHistoryModule {}
