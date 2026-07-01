import { Body, Controller, HttpStatus, Param, Query, UseFilters, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { GetJWTPayload } from '@common/decorators/get-jwt-payload';
import { Roles } from '@common/decorators/roles/roles';
import { ApiScopeResource } from '@common/decorators/scopes';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { ScopesGuard } from '@common/guards/scopes';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { CONTROLLERS_INFO, HWID_CONTROLLER } from '@libs/contracts/api';
import {
    BlockHwidCommand,
    CheckHwidBlockedStatusCommand,
    CreateUserHwidDeviceCommand,
    DeleteAllUserHwidDevicesCommand,
    DeleteUserHwidDeviceCommand,
    GetAllHwidDevicesCommand,
    GetBlockedHwidsCommand,
    GetDevicesByHwidCommand,
    GetHwidDevicesStatsCommand,
    GetTopUsersByHwidDevicesCommand,
    GetUserHwidDevicesCommand,
    UnblockHwidCommand,
} from '@libs/contracts/commands';
import { ROLE } from '@libs/contracts/constants';

import { IJWTAuthPayload } from '@modules/auth/interfaces';

import {
    BlockHwidRequestDto,
    BlockHwidResponseDto,
    CheckHwidBlockedStatusRequestDto,
    CheckHwidBlockedStatusResponseDto,
    CreateUserHwidDeviceRequestDto,
    CreateUserHwidDeviceResponseDto,
    DeleteAllUserHwidDevicesRequestDto,
    DeleteAllUserHwidDevicesResponseDto,
    DeleteUserHwidDeviceRequestDto,
    DeleteUserHwidDeviceResponseDto,
    GetAllHwidDevicesRequestQueryDto,
    GetAllHwidDevicesResponseDto,
    GetBlockedHwidsRequestQueryDto,
    GetBlockedHwidsResponseDto,
    GetDevicesByHwidRequestDto,
    GetDevicesByHwidResponseDto,
    GetHwidDevicesStatsResponseDto,
    GetTopUsersByHwidDevicesRequestQueryDto,
    GetTopUsersByHwidDevicesResponseDto,
    GetUserHwidDevicesRequestDto,
    GetUserHwidDevicesResponseDto,
    UnblockHwidRequestDto,
    UnblockHwidResponseDto,
} from './dtos';
import { HwidUserDevicesService } from './hwid-user-devices.service';
import {
    BaseBlockedHwidResponseModel,
    BaseUserHwidDevicesResponseModel,
    GetAllHwidDevicesResponseModel,
} from './models';

function resolveActor(payload: IJWTAuthPayload): string {
    if (payload.username) {
        return payload.username;
    }

    if (payload.uuid) {
        return `api:${payload.uuid}`;
    }

    return 'unknown';
}

@ApiBearerAuth('Authorization')
@ApiScopeResource(CONTROLLERS_INFO.HWID_USER_DEVICES.resource)
@ApiTags(CONTROLLERS_INFO.HWID_USER_DEVICES.tag)
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard, ScopesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(HWID_CONTROLLER)
export class HwidUserDevicesController {
    constructor(private readonly hwidUserDevicesService: HwidUserDevicesService) {}

    @ApiOkResponse({
        type: GetAllHwidDevicesResponseDto,
        description: 'Hwid devices fetched successfully',
    })
    @ApiQuery({
        name: 'start',
        type: 'number',
        required: false,
        description: 'Offset for pagination',
    })
    @ApiQuery({
        name: 'size',
        type: 'number',
        required: false,
        description: 'Page size for pagination',
    })
    @Endpoint({
        command: GetAllHwidDevicesCommand,
        httpCode: HttpStatus.OK,
    })
    async getAllUsers(
        @Query() query: GetAllHwidDevicesRequestQueryDto,
    ): Promise<GetAllHwidDevicesResponseDto> {
        const { start, size, filters, filterModes, globalFilterMode, sorting } = query;
        const result = await this.hwidUserDevicesService.getAllHwidDevices({
            start,
            size,
            filters,
            filterModes,
            globalFilterMode,
            sorting,
        });

        const data = errorHandler(result);
        return {
            response: new GetAllHwidDevicesResponseModel({
                total: data.total,
                devices: data.devices.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            }),
        };
    }

    @ApiNotFoundResponse({
        description: 'One of requested resources not found',
    })
    @ApiOkResponse({
        type: CreateUserHwidDeviceResponseDto,
        description: 'User HWID device created successfully',
    })
    @Endpoint({
        command: CreateUserHwidDeviceCommand,
        httpCode: HttpStatus.OK,
        apiBody: CreateUserHwidDeviceRequestDto,
    })
    async createUserHwidDevice(
        @Body() body: CreateUserHwidDeviceRequestDto,
    ): Promise<CreateUserHwidDeviceResponseDto> {
        const result = await this.hwidUserDevicesService.createUserHwidDevice(body);

        const data = errorHandler(result);
        return {
            response: {
                total: data.length,
                devices: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            },
        };
    }

    @ApiNotFoundResponse({
        description: 'One of requested resources not found',
    })
    @ApiOkResponse({
        type: DeleteUserHwidDeviceResponseDto,
        description: 'User HWID device deleted successfully',
    })
    @Endpoint({
        command: DeleteUserHwidDeviceCommand,
        httpCode: HttpStatus.OK,
        apiBody: DeleteUserHwidDeviceRequestDto,
    })
    async deleteUserHwidDevice(
        @Body() body: DeleteUserHwidDeviceRequestDto,
    ): Promise<DeleteUserHwidDeviceResponseDto> {
        const result = await this.hwidUserDevicesService.deleteUserHwidDevice(
            body.hwid,
            body.userUuid,
        );

        const data = errorHandler(result);
        return {
            response: {
                total: data.length,
                devices: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            },
        };
    }

    @ApiNotFoundResponse({
        description: 'One of requested resources not found',
    })
    @ApiOkResponse({
        type: DeleteAllUserHwidDevicesResponseDto,
        description: 'User HWID devices deleted successfully',
    })
    @Endpoint({
        command: DeleteAllUserHwidDevicesCommand,
        httpCode: HttpStatus.OK,
        apiBody: DeleteAllUserHwidDevicesRequestDto,
    })
    async deleteAllUserHwidDevices(
        @Body() body: DeleteAllUserHwidDevicesRequestDto,
    ): Promise<DeleteAllUserHwidDevicesResponseDto> {
        const result = await this.hwidUserDevicesService.deleteAllUserHwidDevices(body.userUuid);

        const data = errorHandler(result);
        return {
            response: {
                total: data.length,
                devices: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            },
        };
    }

    @ApiOkResponse({
        type: GetHwidDevicesStatsResponseDto,
        description: 'Hwid devices stats fetched successfully',
    })
    @Endpoint({
        command: GetHwidDevicesStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getHwidDevicesStats(): Promise<GetHwidDevicesStatsResponseDto> {
        const result = await this.hwidUserDevicesService.getHwidDevicesStats();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetTopUsersByHwidDevicesResponseDto,
        description: 'Top users by HWID devices fetched successfully',
    })
    @ApiQuery({
        name: 'start',
        type: 'number',
        required: false,
        description: 'Offset for pagination',
    })
    @ApiQuery({
        name: 'size',
        type: 'number',
        required: false,
        description: 'Page size for pagination',
    })
    @Endpoint({
        command: GetTopUsersByHwidDevicesCommand,
        httpCode: HttpStatus.OK,
    })
    async getTopUsersByHwidDevices(
        @Query() query: GetTopUsersByHwidDevicesRequestQueryDto,
    ): Promise<GetTopUsersByHwidDevicesResponseDto> {
        const { start, size } = query;
        const result = await this.hwidUserDevicesService.getTopUsersByHwidDevices({
            start,
            size,
        });

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiNotFoundResponse({
        description: 'One of requested resources not found',
    })
    @ApiOkResponse({
        type: GetUserHwidDevicesResponseDto,
        description: 'User HWID devices fetched successfully',
    })
    @ApiParam({ name: 'userUuid', type: String, description: 'UUID of the user', required: true })
    @Endpoint({
        command: GetUserHwidDevicesCommand,
        httpCode: HttpStatus.OK,
    })
    async getUserHwidDevices(
        @Param() paramData: GetUserHwidDevicesRequestDto,
    ): Promise<GetUserHwidDevicesResponseDto> {
        const result = await this.hwidUserDevicesService.getUserHwidDevices(paramData.userUuid);

        const data = errorHandler(result);
        return {
            response: {
                total: data.length,
                devices: data.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            },
        };
    }

    @ApiOkResponse({
        type: GetBlockedHwidsResponseDto,
        description: 'Blocked HWIDs fetched successfully',
    })
    @ApiQuery({
        name: 'start',
        type: 'number',
        required: false,
        description: 'Offset for pagination',
    })
    @ApiQuery({
        name: 'size',
        type: 'number',
        required: false,
        description: 'Page size for pagination',
    })
    @Endpoint({
        command: GetBlockedHwidsCommand,
        httpCode: HttpStatus.OK,
    })
    async getBlockedHwids(
        @Query() query: GetBlockedHwidsRequestQueryDto,
    ): Promise<GetBlockedHwidsResponseDto> {
        const result = await this.hwidUserDevicesService.getBlockedHwids(query);
        const data = errorHandler(result);

        return {
            response: {
                total: data.total,
                blocked: data.blocked.map((item) => new BaseBlockedHwidResponseModel(item)),
            },
        };
    }

    @ApiOkResponse({
        type: BlockHwidResponseDto,
        description: 'HWID blocked successfully',
    })
    @Endpoint({
        command: BlockHwidCommand,
        httpCode: HttpStatus.OK,
        apiBody: BlockHwidRequestDto,
    })
    async blockHwid(
        @Body() body: BlockHwidRequestDto,
        @GetJWTPayload() payload: IJWTAuthPayload,
    ): Promise<BlockHwidResponseDto> {
        const result = await this.hwidUserDevicesService.blockHwid(body, resolveActor(payload));
        const data = errorHandler(result);

        return {
            response: new BaseBlockedHwidResponseModel(data),
        };
    }

    @ApiNotFoundResponse({
        description: 'HWID block not found',
    })
    @ApiOkResponse({
        type: UnblockHwidResponseDto,
        description: 'HWID unblocked successfully',
    })
    @ApiParam({ name: 'hwid', type: String, description: 'HWID to unblock', required: true })
    @Endpoint({
        command: UnblockHwidCommand,
        httpCode: HttpStatus.OK,
    })
    async unblockHwid(
        @Param() paramData: UnblockHwidRequestDto,
        @GetJWTPayload() payload: IJWTAuthPayload,
    ): Promise<UnblockHwidResponseDto> {
        const result = await this.hwidUserDevicesService.unblockHwid(
            paramData.hwid,
            resolveActor(payload),
        );
        const data = errorHandler(result);

        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: CheckHwidBlockedStatusResponseDto,
        description: 'HWID blocked status fetched successfully',
    })
    @ApiParam({ name: 'hwid', type: String, description: 'HWID', required: true })
    @Endpoint({
        command: CheckHwidBlockedStatusCommand,
        httpCode: HttpStatus.OK,
    })
    async checkHwidBlockedStatus(
        @Param() paramData: CheckHwidBlockedStatusRequestDto,
    ): Promise<CheckHwidBlockedStatusResponseDto> {
        const result = await this.hwidUserDevicesService.checkHwidBlockedStatus(paramData.hwid);
        const data = errorHandler(result);

        return {
            response: data,
        };
    }

    @ApiOkResponse({
        type: GetDevicesByHwidResponseDto,
        description: 'Devices by HWID fetched successfully',
    })
    @ApiParam({ name: 'hwid', type: String, description: 'HWID', required: true })
    @Endpoint({
        command: GetDevicesByHwidCommand,
        httpCode: HttpStatus.OK,
    })
    async getDevicesByHwid(
        @Param() paramData: GetDevicesByHwidRequestDto,
    ): Promise<GetDevicesByHwidResponseDto> {
        const result = await this.hwidUserDevicesService.getDevicesByHwid(paramData.hwid);
        const data = errorHandler(result);

        return {
            response: {
                total: data.total,
                devices: data.devices.map((item) => new BaseUserHwidDevicesResponseModel(item)),
            },
        };
    }
}
