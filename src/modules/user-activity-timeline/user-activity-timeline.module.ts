import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { UserActivityTimelineRepository } from './repositories/user-activity-timeline.repository';
import { UserActivityTimelineController } from './user-activity-timeline.controller';
import { UserActivityTimelineConverter } from './user-activity-timeline.converter';
import { UserActivityTimelineEventsListener } from './user-activity-timeline.events-listener';
import { UserActivityTimelineService } from './user-activity-timeline.service';
import { UserActivityTimelineWriterService } from './user-activity-timeline-writer.service';

@Module({
    imports: [CqrsModule],
    controllers: [UserActivityTimelineController],
    providers: [
        UserActivityTimelineRepository,
        UserActivityTimelineConverter,
        UserActivityTimelineService,
        UserActivityTimelineWriterService,
        UserActivityTimelineEventsListener,
    ],
    exports: [UserActivityTimelineWriterService],
})
export class UserActivityTimelineModule {}
