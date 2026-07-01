import { createZodDto } from 'nestjs-zod';
import {
    AnalyzePostgresQueryCommand,
    ConfirmPostgresManagementOAuthCommand,
    ExecutePostgresQueryCommand,
    GetPostgresManagementGateStatusCommand,
    GetPostgresManagementPasskeyOptionsCommand,
    GetPostgresTablesCommand,
    PreparePostgresManagementOAuthCommand,
    RequestPostgresManagementCodeCommand,
    RequestPostgresQueryConfirmationCommand,
    VerifyPostgresManagementCodeCommand,
    VerifyPostgresManagementPasskeyCommand,
    VerifyPostgresManagementPasswordCommand,
    VerifyPostgresQueryConfirmationCommand,
    RevokePostgresManagementGateCommand,
} from '@libs/contracts/commands';

export class GetPostgresManagementGateStatusResponseDto extends createZodDto(
    GetPostgresManagementGateStatusCommand.ResponseSchema,
) {}

export class RequestPostgresManagementCodeResponseDto extends createZodDto(
    RequestPostgresManagementCodeCommand.ResponseSchema,
) {}

export class VerifyPostgresManagementCodeRequestDto extends createZodDto(
    VerifyPostgresManagementCodeCommand.RequestSchema,
) {}

export class VerifyPostgresManagementCodeResponseDto extends createZodDto(
    VerifyPostgresManagementCodeCommand.ResponseSchema,
) {}

export class VerifyPostgresManagementPasswordRequestDto extends createZodDto(
    VerifyPostgresManagementPasswordCommand.RequestSchema,
) {}

export class VerifyPostgresManagementPasswordResponseDto extends createZodDto(
    VerifyPostgresManagementPasswordCommand.ResponseSchema,
) {}

export class GetPostgresManagementPasskeyOptionsResponseDto extends createZodDto(
    GetPostgresManagementPasskeyOptionsCommand.ResponseSchema,
) {}

export class VerifyPostgresManagementPasskeyRequestDto extends createZodDto(
    VerifyPostgresManagementPasskeyCommand.RequestSchema,
) {}

export class VerifyPostgresManagementPasskeyResponseDto extends createZodDto(
    VerifyPostgresManagementPasskeyCommand.ResponseSchema,
) {}

export class PreparePostgresManagementOAuthResponseDto extends createZodDto(
    PreparePostgresManagementOAuthCommand.ResponseSchema,
) {}

export class ConfirmPostgresManagementOAuthResponseDto extends createZodDto(
    ConfirmPostgresManagementOAuthCommand.ResponseSchema,
) {}

export class GetPostgresTablesResponseDto extends createZodDto(
    GetPostgresTablesCommand.ResponseSchema,
) {}

export class AnalyzePostgresQueryRequestDto extends createZodDto(
    AnalyzePostgresQueryCommand.RequestSchema,
) {}

export class AnalyzePostgresQueryResponseDto extends createZodDto(
    AnalyzePostgresQueryCommand.ResponseSchema,
) {}

export class RequestPostgresQueryConfirmationRequestDto extends createZodDto(
    RequestPostgresQueryConfirmationCommand.RequestSchema,
) {}

export class RequestPostgresQueryConfirmationResponseDto extends createZodDto(
    RequestPostgresQueryConfirmationCommand.ResponseSchema,
) {}

export class VerifyPostgresQueryConfirmationRequestDto extends createZodDto(
    VerifyPostgresQueryConfirmationCommand.RequestSchema,
) {}

export class VerifyPostgresQueryConfirmationResponseDto extends createZodDto(
    VerifyPostgresQueryConfirmationCommand.ResponseSchema,
) {}

export class ExecutePostgresQueryRequestDto extends createZodDto(
    ExecutePostgresQueryCommand.RequestSchema,
) {}

export class ExecutePostgresQueryResponseDto extends createZodDto(
    ExecutePostgresQueryCommand.ResponseSchema,
) {}

export class RevokePostgresManagementGateResponseDto extends createZodDto(
    RevokePostgresManagementGateCommand.ResponseSchema,
) {}
