import { createZodDto } from 'nestjs-zod';
import {
    GetDatabaseBackupSettingsCommand,
    RunDatabaseBackupNowCommand,
    UpdateDatabaseBackupSettingsCommand,
} from '@libs/contracts/commands';

export class GetDatabaseBackupSettingsResponseDto extends createZodDto(
    GetDatabaseBackupSettingsCommand.ResponseSchema,
) {}

export class UpdateDatabaseBackupSettingsRequestDto extends createZodDto(
    UpdateDatabaseBackupSettingsCommand.RequestSchema,
) {}

export class UpdateDatabaseBackupSettingsResponseDto extends createZodDto(
    UpdateDatabaseBackupSettingsCommand.ResponseSchema,
) {}

export class RunDatabaseBackupNowResponseDto extends createZodDto(
    RunDatabaseBackupNowCommand.ResponseSchema,
) {}
