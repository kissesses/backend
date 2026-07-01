import { createZodDto } from 'nestjs-zod';

import {
    CreateTelegramNotificationTopicsCommand,
    GetTelegramNotificationRoutesCommand,
    UpdateTelegramNotificationRoutesCommand,
} from '@libs/contracts/commands';

export class GetTelegramNotificationRoutesResponseDto extends createZodDto(
    GetTelegramNotificationRoutesCommand.ResponseSchema,
) {}

export class UpdateTelegramNotificationRoutesRequestDto extends createZodDto(
    UpdateTelegramNotificationRoutesCommand.RequestSchema,
) {}

export class UpdateTelegramNotificationRoutesResponseDto extends createZodDto(
    UpdateTelegramNotificationRoutesCommand.ResponseSchema,
) {}

export class CreateTelegramNotificationTopicsResponseDto extends createZodDto(
    CreateTelegramNotificationTopicsCommand.ResponseSchema,
) {}
