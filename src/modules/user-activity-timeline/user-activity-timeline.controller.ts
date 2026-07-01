import { Controller, HttpStatus, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { CONTROLLERS_INFO, USER_ACTIVITY_TIMELINE_CONTROLLER } from '@libs/contracts/api';
import {
    GetUserActivityTimelineCommand,
    GetUserActivityTimelineStatsCommand,
} from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import {
    GetUserActivityTimelineRequestQueryDto,
    GetUserActivityTimelineResponseDto,
    GetUserActivityTimelineStatsResponseDto,
} from './dtos';
import {
    BaseUserActivityTimelineEventResponseModel,
    GetUserActivityTimelineResponseModel,
} from './models';
import { UserActivityTimelineService } from './user-activity-timeline.service';

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.USER_ACTIVITY_TIMELINE.resource)
@ApiTags(CONTROLLERS_INFO.USER_ACTIVITY_TIMELINE.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(USER_ACTIVITY_TIMELINE_CONTROLLER)
export class UserActivityTimelineController {
    constructor(private readonly userActivityTimelineService: UserActivityTimelineService) {}

    @ApiOkResponse({
        type: GetUserActivityTimelineResponseDto,
        description: 'User activity timeline fetched successfully',
    })
    @ApiQuery({
        name: 'start',
        type: 'number',
        required: false,
        description: 'Offset for pagination',
    })
    @ApiQuery({
        name: 'size',
        type: 'number',
        required: false,
        description: 'Page size for pagination',
    })
    @Endpoint({
        command: GetUserActivityTimelineCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserActivityTimeline(
        @Query() query: GetUserActivityTimelineRequestQueryDto,
    ): Promise<GetUserActivityTimelineResponseDto> {
        const { start, size, filters, filterModes, globalFilterMode, sorting } = query;
        const result = await this.userActivityTimelineService.getUserActivityTimeline({
            start,
            size,
            filters,
            filterModes,
            globalFilterMode,
            sorting,
        });

        const data = errorHandler(result);
        return {
            response: new GetUserActivityTimelineResponseModel({
                total: data.total,
                records: data.records.map(
                    (item) => new BaseUserActivityTimelineEventResponseModel(item),
                ),
            }),
        };
    }

    @ApiOkResponse({
        type: GetUserActivityTimelineStatsResponseDto,
        description: 'User activity timeline stats fetched successfully',
    })
    @Endpoint({
        command: GetUserActivityTimelineStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserActivityTimelineStats(): Promise<GetUserActivityTimelineStatsResponseDto> {
        const result = await this.userActivityTimelineService.getUserActivityTimelineStats();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
