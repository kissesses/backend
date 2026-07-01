import { GetUserActivityTimelineStatsCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class GetUserActivityTimelineStatsResponseDto extends createZodDto(
    GetUserActivityTimelineStatsCommand.ResponseSchema,
) {}
