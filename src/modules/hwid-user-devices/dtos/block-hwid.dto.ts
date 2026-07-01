import { BlockHwidCommand } from '@contract/commands';
import { createZodDto } from 'nestjs-zod';

export class BlockHwidRequestDto extends createZodDto(BlockHwidCommand.RequestSchema) {}

export class BlockHwidResponseDto extends createZodDto(BlockHwidCommand.ResponseSchema) {}
