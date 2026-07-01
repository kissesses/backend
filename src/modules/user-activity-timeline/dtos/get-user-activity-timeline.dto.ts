import { GetUserActivityTimelineCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class GetUserActivityTimelineRequestQueryDto extends createZodDto(
    GetUserActivityTimelineCommand.RequestQuerySchema,
) {}

export class GetUserActivityTimelineResponseDto extends createZodDto(
    GetUserActivityTimelineCommand.ResponseSchema,
) {}
