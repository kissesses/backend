import { UnblockHwidCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class UnblockHwidRequestDto extends createZodDto(UnblockHwidCommand.RequestSchema) {}

export class UnblockHwidResponseDto extends createZodDto(UnblockHwidCommand.ResponseSchema) {}
