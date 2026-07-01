import { GetDevicesByHwidCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class GetDevicesByHwidRequestDto extends createZodDto(
    GetDevicesByHwidCommand.RequestSchema,
) {}

export class GetDevicesByHwidResponseDto extends createZodDto(
    GetDevicesByHwidCommand.ResponseSchema,
) {}
