import { CheckHwidBlockedStatusCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class CheckHwidBlockedStatusRequestDto extends createZodDto(
    CheckHwidBlockedStatusCommand.RequestSchema,
) {}

export class CheckHwidBlockedStatusResponseDto extends createZodDto(
    CheckHwidBlockedStatusCommand.ResponseSchema,
) {}
