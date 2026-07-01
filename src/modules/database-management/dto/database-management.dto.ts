import { createZodDto } from 'nestjs-zod';
import {
    ConfirmDatabaseManagementOAuthCommand,
    GetDatabaseManagementArchivesCommand,
    GetDatabaseManagementGateStatusCommand,
    GetDatabaseManagementPasskeyOptionsCommand,
    PrepareDatabaseManagementOAuthCommand,
    RequestDatabaseManagementCodeCommand,
    VerifyDatabaseManagementCodeCommand,
    VerifyDatabaseManagementPasskeyCommand,
    VerifyDatabaseManagementPasswordCommand,
    RevokeDatabaseManagementGateCommand,
} from '@libs/contracts/commands';

export class GetDatabaseManagementGateStatusResponseDto extends createZodDto(
    GetDatabaseManagementGateStatusCommand.ResponseSchema,
) {}

export class RequestDatabaseManagementCodeResponseDto extends createZodDto(
    RequestDatabaseManagementCodeCommand.ResponseSchema,
) {}

export class VerifyDatabaseManagementCodeRequestDto extends createZodDto(
    VerifyDatabaseManagementCodeCommand.RequestSchema,
) {}

export class VerifyDatabaseManagementCodeResponseDto extends createZodDto(
    VerifyDatabaseManagementCodeCommand.ResponseSchema,
) {}

export class VerifyDatabaseManagementPasswordRequestDto extends createZodDto(
    VerifyDatabaseManagementPasswordCommand.RequestSchema,
) {}

export class VerifyDatabaseManagementPasswordResponseDto extends createZodDto(
    VerifyDatabaseManagementPasswordCommand.ResponseSchema,
) {}

export class GetDatabaseManagementPasskeyOptionsResponseDto extends createZodDto(
    GetDatabaseManagementPasskeyOptionsCommand.ResponseSchema,
) {}

export class VerifyDatabaseManagementPasskeyRequestDto extends createZodDto(
    VerifyDatabaseManagementPasskeyCommand.RequestSchema,
) {}

export class VerifyDatabaseManagementPasskeyResponseDto extends createZodDto(
    VerifyDatabaseManagementPasskeyCommand.ResponseSchema,
) {}

export class GetDatabaseManagementArchivesResponseDto extends createZodDto(
    GetDatabaseManagementArchivesCommand.ResponseSchema,
) {}

export class PrepareDatabaseManagementOAuthResponseDto extends createZodDto(
    PrepareDatabaseManagementOAuthCommand.ResponseSchema,
) {}

export class ConfirmDatabaseManagementOAuthResponseDto extends createZodDto(
    ConfirmDatabaseManagementOAuthCommand.ResponseSchema,
) {}

export class RevokeDatabaseManagementGateResponseDto extends createZodDto(
    RevokeDatabaseManagementGateCommand.ResponseSchema,
) {}
