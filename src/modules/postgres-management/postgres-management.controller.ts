import { CONTROLLERS_INFO, POSTGRES_MANAGEMENT_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { Endpoint } from '@common/decorators/base-endpoint';
import { GetJWTPayload } from '@common/decorators/get-jwt-payload';
import { Roles } from '@common/decorators/roles/roles';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { PostgresManagementElevationGuard } from '@common/guards/postgres-management-elevation/postgres-management-elevation.guard';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { errorHandler } from '@common/helpers/error-handler.helper';
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

import { IJWTAuthPayload } from '@modules/auth/interfaces';

import {
    AnalyzePostgresQueryRequestDto,
    AnalyzePostgresQueryResponseDto,
    ConfirmPostgresManagementOAuthResponseDto,
    ExecutePostgresQueryRequestDto,
    ExecutePostgresQueryResponseDto,
    GetPostgresManagementGateStatusResponseDto,
    GetPostgresManagementPasskeyOptionsResponseDto,
    GetPostgresTablesResponseDto,
    PreparePostgresManagementOAuthResponseDto,
    RequestPostgresManagementCodeResponseDto,
    RequestPostgresQueryConfirmationRequestDto,
    RequestPostgresQueryConfirmationResponseDto,
    VerifyPostgresManagementCodeRequestDto,
    VerifyPostgresManagementCodeResponseDto,
    VerifyPostgresManagementPasskeyRequestDto,
    VerifyPostgresManagementPasskeyResponseDto,
    VerifyPostgresManagementPasswordRequestDto,
    VerifyPostgresManagementPasswordResponseDto,
    VerifyPostgresQueryConfirmationRequestDto,
    VerifyPostgresQueryConfirmationResponseDto,
    RevokePostgresManagementGateResponseDto,
} from './dto/postgres-management.dto';
import { PostgresManagementGateService } from './postgres-management-gate.service';
import { PostgresSqlService } from './postgres-sql.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.POSTGRES_MANAGEMENT.tag)
@Roles(ROLE.ADMIN)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(POSTGRES_MANAGEMENT_CONTROLLER)
export class PostgresManagementController {
    constructor(
        private readonly gateService: PostgresManagementGateService,
        private readonly sqlService: PostgresSqlService,
    ) {}

    @ApiOkResponse({ type: GetPostgresManagementGateStatusResponseDto })
    @Endpoint({
        command: GetPostgresManagementGateStatusCommand,
        httpCode: HttpStatus.OK,
    })
    async getGateStatus(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<GetPostgresManagementGateStatusResponseDto> {
        const result = await this.gateService.getGateStatus(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: RequestPostgresManagementCodeResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60_000 } })
    @Endpoint({
        command: RequestPostgresManagementCodeCommand,
        httpCode: HttpStatus.OK,
    })
    async requestCode(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<RequestPostgresManagementCodeResponseDto> {
        const result = await this.gateService.requestTelegramCode(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: VerifyPostgresManagementCodeResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: VerifyPostgresManagementCodeCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyPostgresManagementCodeRequestDto,
    })
    async verifyCode(
        @GetJWTPayload() user: IJWTAuthPayload,
        @Body() body: VerifyPostgresManagementCodeRequestDto,
    ): Promise<VerifyPostgresManagementCodeResponseDto> {
        const result = await this.gateService.verifyTelegramCode(user.uuid!, body.code);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: VerifyPostgresManagementPasswordResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: VerifyPostgresManagementPasswordCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyPostgresManagementPasswordRequestDto,
    })
    async verifyPassword(
        @GetJWTPayload() user: IJWTAuthPayload,
        @Body() body: VerifyPostgresManagementPasswordRequestDto,
    ): Promise<VerifyPostgresManagementPasswordResponseDto> {
        const result = await this.gateService.verifyPassword(user.uuid!, body.password);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: GetPostgresManagementPasskeyOptionsResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: GetPostgresManagementPasskeyOptionsCommand,
        httpCode: HttpStatus.OK,
    })
    async passkeyOptions(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<GetPostgresManagementPasskeyOptionsResponseDto> {
        const result = await this.gateService.generatePasskeyOptions(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: VerifyPostgresManagementPasskeyResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: VerifyPostgresManagementPasskeyCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyPostgresManagementPasskeyRequestDto,
    })
    async verifyPasskey(
        @GetJWTPayload() user: IJWTAuthPayload,
        @Body() body: VerifyPostgresManagementPasskeyRequestDto,
    ): Promise<VerifyPostgresManagementPasskeyResponseDto> {
        const result = await this.gateService.verifyPasskey(user.uuid!, body);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: PreparePostgresManagementOAuthResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: PreparePostgresManagementOAuthCommand,
        httpCode: HttpStatus.OK,
    })
    async prepareOAuth(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<PreparePostgresManagementOAuthResponseDto> {
        const result = await this.gateService.prepareOAuthElevation(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: ConfirmPostgresManagementOAuthResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: ConfirmPostgresManagementOAuthCommand,
        httpCode: HttpStatus.OK,
    })
    async confirmOAuth(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<ConfirmPostgresManagementOAuthResponseDto> {
        const result = await this.gateService.confirmOAuthElevation(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: RevokePostgresManagementGateResponseDto })
    @UseGuards(PostgresManagementElevationGuard)
    @Endpoint({
        command: RevokePostgresManagementGateCommand,
        httpCode: HttpStatus.OK,
    })
    async revokeElevation(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<RevokePostgresManagementGateResponseDto> {
        const result = await this.gateService.revokeElevation(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: GetPostgresTablesResponseDto })
    @UseGuards(PostgresManagementElevationGuard, ThrottlerGuard)
    @Throttle({ auth: { limit: 30, ttl: 60_000 } })
    @Endpoint({
        command: GetPostgresTablesCommand,
        httpCode: HttpStatus.OK,
    })
    async getTables(): Promise<GetPostgresTablesResponseDto> {
        const result = await this.sqlService.listTables();
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: AnalyzePostgresQueryResponseDto })
    @UseGuards(PostgresManagementElevationGuard, ThrottlerGuard)
    @Throttle({ auth: { limit: 30, ttl: 60_000 } })
    @Endpoint({
        command: AnalyzePostgresQueryCommand,
        httpCode: HttpStatus.OK,
        apiBody: AnalyzePostgresQueryRequestDto,
    })
    async analyzeQuery(
        @Body() body: AnalyzePostgresQueryRequestDto,
    ): Promise<AnalyzePostgresQueryResponseDto> {
        const result = await this.sqlService.analyzeQuery(body.sql);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: RequestPostgresQueryConfirmationResponseDto })
    @UseGuards(PostgresManagementElevationGuard, ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60_000 } })
    @Endpoint({
        command: RequestPostgresQueryConfirmationCommand,
        httpCode: HttpStatus.OK,
        apiBody: RequestPostgresQueryConfirmationRequestDto,
    })
    async requestConfirmation(
        @GetJWTPayload() user: IJWTAuthPayload,
        @Body() body: RequestPostgresQueryConfirmationRequestDto,
    ): Promise<RequestPostgresQueryConfirmationResponseDto> {
        const result = await this.sqlService.requestConfirmation(user.uuid!, body.sql);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: VerifyPostgresQueryConfirmationResponseDto })
    @UseGuards(PostgresManagementElevationGuard, ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: VerifyPostgresQueryConfirmationCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyPostgresQueryConfirmationRequestDto,
    })
    async verifyConfirmation(
        @GetJWTPayload() user: IJWTAuthPayload,
        @Body() body: VerifyPostgresQueryConfirmationRequestDto,
    ): Promise<VerifyPostgresQueryConfirmationResponseDto> {
        const result = await this.sqlService.verifyConfirmation(
            user.uuid!,
            body.confirmationId,
            body.code,
        );
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: ExecutePostgresQueryResponseDto })
    @UseGuards(PostgresManagementElevationGuard, ThrottlerGuard)
    @Throttle({ auth: { limit: 30, ttl: 60_000 } })
    @Endpoint({
        command: ExecutePostgresQueryCommand,
        httpCode: HttpStatus.OK,
        apiBody: ExecutePostgresQueryRequestDto,
    })
    async executeQuery(
        @GetJWTPayload() user: IJWTAuthPayload,
        @Body() body: ExecutePostgresQueryRequestDto,
    ): Promise<ExecutePostgresQueryResponseDto> {
        const result = await this.sqlService.executeQuery(
            user.uuid!,
            body.sql,
            body.confirmationToken,
        );
        return { response: errorHandler(result) };
    }
}
