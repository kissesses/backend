import { GetBlockedHwidsCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class GetBlockedHwidsRequestQueryDto extends createZodDto(
    GetBlockedHwidsCommand.RequestQuerySchema,
) {}

export class GetBlockedHwidsResponseDto extends createZodDto(
    GetBlockedHwidsCommand.ResponseSchema,
) {}
