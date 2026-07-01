import { Injectable, Logger } from '@nestjs/common';

import { fail, ok, TResult } from '@common/types';
import { GetUserActivityTimelineCommand } from '@libs/contracts/commands';
import { ERRORS } from '@libs/contracts/constants';

import { UserActivityEventEntity } from './entities';
import { GetUserActivityTimelineStatsResponseModel } from './models';
import {
    UserActivityTimelineRecord,
    UserActivityTimelineRepository,
} from './repositories/user-activity-timeline.repository';

@Injectable()
export class UserActivityTimelineService {
    private readonly logger = new Logger(UserActivityTimelineService.name);

    constructor(private readonly userActivityTimelineRepository: UserActivityTimelineRepository) {}

    public async getUserActivityTimeline(
        dto: GetUserActivityTimelineCommand.RequestQuery,
    ): Promise<
        TResult<{
            total: number;
            records: UserActivityTimelineRecord[];
        }>
    > {
        try {
            const [records, total] =
                await this.userActivityTimelineRepository.getAllUserActivityTimeline(dto);

            return ok({
                records,
                total,
            });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_ACTIVITY_TIMELINE_ERROR);
        }
    }

    public async getUserActivityTimelineStats(): Promise<
        TResult<GetUserActivityTimelineStatsResponseModel>
    > {
        try {
            const stats = await this.userActivityTimelineRepository.getUserActivityTimelineStats();
            const hourlyEventStats =
                await this.userActivityTimelineRepository.getHourlyEventStats();

            return ok(
                new GetUserActivityTimelineStatsResponseModel({
                    byEventType: stats.byEventType,
                    hourlyEventStats,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_ACTIVITY_TIMELINE_STATS_ERROR);
        }
    }

    public async createEvent(
        entity: UserActivityEventEntity,
    ): Promise<TResult<UserActivityEventEntity>> {
        try {
            const result = await this.userActivityTimelineRepository.create(entity);
            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_USER_ACTIVITY_EVENT_ERROR);
        }
    }
}
