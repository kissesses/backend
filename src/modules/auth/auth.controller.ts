import { Body, Controller, HttpStatus, Query, Res, UseFilters, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
    ApiForbiddenResponse,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { IpAddress } from '@common/decorators/get-ip/get-ip';
import { GetRemnawaveSettings } from '@common/decorators/get-remnawave-settings';
import { UserAgent } from '@common/decorators/get-useragent/get-useragent';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import { CONTROLLERS_INFO } from '@libs/contracts/api';
import { AUTH_CONTROLLER } from '@libs/contracts/api/controllers/auth';
import { ROLE } from '@libs/contracts/constants';
import {
    GetSessionCommand,
    GetStatusCommand,
    LoginCommand,
    LogoutCommand,
    RegisterCommand,
    OAuth2AuthorizeCommand,
    OAuth2CallbackCommand,
    GetPasskeyAuthenticationOptionsCommand,
    VerifyPasskeyAuthenticationCommand,
} from '@libs/contracts/commands';

import { RemnawaveSettingsEntity } from '@modules/remnawave-settings/entities';

import { AuthService } from './auth.service';
import {
    GetStatusResponseDto,
    LoginRequestDto,
    LoginResponseDto,
    RegisterRequestDto,
    RegisterResponseDto,
    OAuth2AuthorizeResponseDto,
    OAuth2CallbackResponseDto,
    OAuth2CallbackRequestDto,
    OAuth2AuthorizeRequestDto,
    GetPasskeyAuthenticationOptionsResponseDto,
    VerifyPasskeyAuthenticationRequestDto,
    VerifyPasskeyAuthenticationResponseDto,
} from './dtos';
import { AuthResponseModel } from './model/auth-response.model';
import { RegisterResponseModel } from './model/register.response.model';
import { OAuth2CallbackPublicResponseModel } from './model/oauth2-callback-public.response.model';
import { clearAdminAuthCookie, setAdminAuthCookie } from './utils/auth-cookie.util';

@ApiTags(CONTROLLERS_INFO.AUTH.tag)
@UseFilters(HttpExceptionFilter)
@Controller(AUTH_CONTROLLER)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiResponse({ type: LoginResponseDto, description: 'Access token for further requests' })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized - Invalid credentials',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Invalid credentials' },
                error: { type: 'string', example: 'Unauthorized' },
            },
        },
    })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: LoginCommand,
        httpCode: HttpStatus.OK,
        apiBody: LoginRequestDto,
    })
    async login(
        @Body() body: LoginRequestDto,
        @IpAddress() ip: string,
        @UserAgent() userAgent: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResponseDto> {
        const result = await this.authService.login(body, ip, userAgent);

        const data = errorHandler(result);
        setAdminAuthCookie(res, data.accessToken);
        return {
            response: new AuthResponseModel(),
        };
    }

    @ApiForbiddenResponse({
        description: 'Forbidden - Registration is not allowed',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 403 },
                message: { type: 'string', example: 'Registration is not allowed' },
                error: { type: 'string', example: 'Forbidden' },
            },
        },
    })
    @ApiResponse({ type: RegisterResponseDto, description: 'Access token for further requests' })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: RegisterCommand,
        httpCode: HttpStatus.CREATED,
        apiBody: RegisterRequestDto,
    })
    async register(
        @Body() body: RegisterRequestDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<RegisterResponseDto> {
        const result = await this.authService.register(body);

        const data = errorHandler(result);
        setAdminAuthCookie(res, data.accessToken);
        return {
            response: new RegisterResponseModel(),
        };
    }

    @ApiResponse({ type: GetStatusResponseDto, description: 'Status of the system' })
    @Endpoint({
        command: GetStatusCommand,
        httpCode: HttpStatus.OK,
    })
    async getStatus(@Query() query: Record<string, string>): Promise<GetStatusResponseDto> {
        const result = await this.authService.getStatus(query);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: OAuth2AuthorizeResponseDto,
        description: 'OAuth2 authorization URL',
    })
    @Endpoint({
        command: OAuth2AuthorizeCommand,
        httpCode: HttpStatus.OK,
        apiBody: OAuth2AuthorizeRequestDto,
    })
    async oauth2Authorize(
        @Body() body: OAuth2AuthorizeRequestDto,
    ): Promise<OAuth2AuthorizeResponseDto> {
        const result = await this.authService.oauth2Authorize(body.provider);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: OAuth2CallbackResponseDto,
        description: 'Access token for further requests',
    })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: OAuth2CallbackCommand,
        httpCode: HttpStatus.OK,
        apiBody: OAuth2CallbackRequestDto,
    })
    async oauth2Callback(
        @Body() body: OAuth2CallbackRequestDto,
        @IpAddress() ip: string,
        @UserAgent() userAgent: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<OAuth2CallbackResponseDto> {
        const result = await this.authService.oauth2Callback(
            body.code,
            body.state,
            body.provider,
            ip,
            userAgent,
        );

        const data = errorHandler(result);
        setAdminAuthCookie(res, data.accessToken);
        return {
            response: new OAuth2CallbackPublicResponseModel(),
        };
    }

    @ApiResponse({
        type: GetPasskeyAuthenticationOptionsResponseDto,
        description: 'Passkey authentication options',
    })
    @Endpoint({
        command: GetPasskeyAuthenticationOptionsCommand,
        httpCode: HttpStatus.OK,
    })
    async passkeyAuthenticationOptions(
        @GetRemnawaveSettings() remnawaveSettings: RemnawaveSettingsEntity,
    ): Promise<GetPasskeyAuthenticationOptionsResponseDto> {
        const result =
            await this.authService.generatePasskeyAuthenticationOptions(remnawaveSettings);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        type: VerifyPasskeyAuthenticationResponseDto,
        description: 'JWT access token after successful passkey authentication',
    })
    @UseGuards(ThrottlerGuard)
    @Throttle({ auth: { limit: 10, ttl: 60_000 } })
    @Endpoint({
        command: VerifyPasskeyAuthenticationCommand,
        httpCode: HttpStatus.OK,
        apiBody: VerifyPasskeyAuthenticationRequestDto,
    })
    async passkeyAuthenticationVerify(
        @Body() body: VerifyPasskeyAuthenticationRequestDto,
        @GetRemnawaveSettings() remnawaveSettings: RemnawaveSettingsEntity,
        @IpAddress() ip: string,
        @UserAgent() userAgent: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<VerifyPasskeyAuthenticationResponseDto> {
        const result = await this.authService.verifyPasskeyAuthentication(
            body,
            remnawaveSettings,
            ip,
            userAgent,
        );

        const data = errorHandler(result);
        setAdminAuthCookie(res, data.accessToken);
        return {
            response: new AuthResponseModel(),
        };
    }

    @Roles(ROLE.ADMIN)
    @UseGuards(JwtDefaultGuard, RolesGuard)
    @Endpoint({
        command: GetSessionCommand,
        httpCode: HttpStatus.OK,
    })
    async getSession(): Promise<{ response: { authenticated: true } }> {
        return {
            response: { authenticated: true },
        };
    }

    @Endpoint({
        command: LogoutCommand,
        httpCode: HttpStatus.OK,
    })
    async logout(@Res({ passthrough: true }) res: Response): Promise<{ response: { success: true } }> {
        clearAdminAuthCookie(res);
        return {
            response: { success: true },
        };
    }
}
