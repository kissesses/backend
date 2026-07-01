import { CONTROLLERS_INFO, DATABASE_MANAGEMENT_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { Endpoint } from '@common/decorators/base-endpoint';
import { GetJWTPayload } from '@common/decorators/get-jwt-payload';
import { Roles } from '@common/decorators/roles/roles';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { DatabaseManagementElevationGuard } from '@common/guards/database-management-elevation/database-management-elevation.guard';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { errorHandler } from '@common/helpers/error-handler.helper';
import {
    GetDatabaseManagementArchivesCommand,
    GetDatabaseManagementGateStatusCommand,
    GetDatabaseManagementPasskeyOptionsCommand,
    RequestDatabaseManagementCodeCommand,
    VerifyDatabaseManagementCodeCommand,
    VerifyDatabaseManagementPasskeyCommand,
    VerifyDatabaseManagementPasswordCommand,
    PrepareDatabaseManagementOAuthCommand,
    ConfirmDatabaseManagementOAuthCommand,
    RevokeDatabaseManagementGateCommand,
} from '@libs/contracts/commands';

import { IJWTAuthPayload } from '@modules/auth/interfaces';

import {
    GetDatabaseManagementArchivesResponseDto,
    GetDatabaseManagementGateStatusResponseDto,
    GetDatabaseManagementPasskeyOptionsResponseDto,
    RequestDatabaseManagementCodeResponseDto,
    VerifyDatabaseManagementCodeRequestDto,
    VerifyDatabaseManagementCodeResponseDto,
    VerifyDatabaseManagementPasskeyRequestDto,
    VerifyDatabaseManagementPasskeyResponseDto,
    VerifyDatabaseManagementPasswordRequestDto,
    VerifyDatabaseManagementPasswordResponseDto,
    PrepareDatabaseManagementOAuthResponseDto,
    ConfirmDatabaseManagementOAuthResponseDto,
    RevokeDatabaseManagementGateResponseDto,
} from './dto/database-management.dto';
import { DatabaseManagementGateService } from './database-management-gate.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.DATABASE_MANAGEMENT.tag)
@Roles(ROLE.ADMIN)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(DATABASE_MANAGEMENT_CONTROLLER)
export class DatabaseManagementController {
    constructor(private readonly gateService: DatabaseManagementGateService) {}

    @ApiOkResponse({ type: GetDatabaseManagementGateStatusResponseDto })
    @Endpoint({
        command: GetDatabaseManagementGateStatusCommand,
        httpCode: HttpStatus.OK,
    })
    async getGateStatus(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<GetDatabaseManagementGateStatusResponseDto> {
        const result = await this.gateService.getGateStatus(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: RequestDatabaseManagementCodeResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 5, ttl: 60_000 } })
    @Endpoint({
        command: RequestDatabaseManagementCodeCommand,
        httpCode: HttpStatus.OK,
    })
    async requestCode(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<RequestDatabaseManagementCodeResponseDto> {
        const result = await this.gateService.requestTelegramCode(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: VerifyDatabaseManagementCodeResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: VerifyDatabaseManagementCodeCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyDatabaseManagementCodeRequestDto,
    })
    async verifyCode(
        @GetJWTPayload() user: IJWTAuthPayload,
        @Body() body: VerifyDatabaseManagementCodeRequestDto,
    ): Promise<VerifyDatabaseManagementCodeResponseDto> {
        const result = await this.gateService.verifyTelegramCode(user.uuid!, body.code);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: VerifyDatabaseManagementPasswordResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: VerifyDatabaseManagementPasswordCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyDatabaseManagementPasswordRequestDto,
    })
    async verifyPassword(
        @GetJWTPayload() user: IJWTAuthPayload,
        @Body() body: VerifyDatabaseManagementPasswordRequestDto,
    ): Promise<VerifyDatabaseManagementPasswordResponseDto> {
        const result = await this.gateService.verifyPassword(user.uuid!, body.password);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: GetDatabaseManagementPasskeyOptionsResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: GetDatabaseManagementPasskeyOptionsCommand,
        httpCode: HttpStatus.OK,
    })
    async passkeyOptions(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<GetDatabaseManagementPasskeyOptionsResponseDto> {
        const result = await this.gateService.generatePasskeyOptions(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: VerifyDatabaseManagementPasskeyResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: VerifyDatabaseManagementPasskeyCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyDatabaseManagementPasskeyRequestDto,
    })
    async verifyPasskey(
        @GetJWTPayload() user: IJWTAuthPayload,
        @Body() body: VerifyDatabaseManagementPasskeyRequestDto,
    ): Promise<VerifyDatabaseManagementPasskeyResponseDto> {
        const result = await this.gateService.verifyPasskey(user.uuid!, body);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: PrepareDatabaseManagementOAuthResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: PrepareDatabaseManagementOAuthCommand,
        httpCode: HttpStatus.OK,
    })
    async prepareOAuth(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<PrepareDatabaseManagementOAuthResponseDto> {
        const result = await this.gateService.prepareOAuthElevation(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: ConfirmDatabaseManagementOAuthResponseDto })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: ConfirmDatabaseManagementOAuthCommand,
        httpCode: HttpStatus.OK,
    })
    async confirmOAuth(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<ConfirmDatabaseManagementOAuthResponseDto> {
        const result = await this.gateService.confirmOAuthElevation(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: RevokeDatabaseManagementGateResponseDto })
    @UseGuards(DatabaseManagementElevationGuard)
    @Endpoint({
        command: RevokeDatabaseManagementGateCommand,
        httpCode: HttpStatus.OK,
    })
    async revokeElevation(
        @GetJWTPayload() user: IJWTAuthPayload,
    ): Promise<RevokeDatabaseManagementGateResponseDto> {
        const result = await this.gateService.revokeElevation(user.uuid!);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({ type: GetDatabaseManagementArchivesResponseDto })
    @UseGuards(DatabaseManagementElevationGuard)
    @Endpoint({
        command: GetDatabaseManagementArchivesCommand,
        httpCode: HttpStatus.OK,
    })
    async getArchives(): Promise<GetDatabaseManagementArchivesResponseDto> {
        const result = await this.gateService.listArchives();
        return { response: errorHandler(result) };
    }
}
