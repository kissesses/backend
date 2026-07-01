import { CONTROLLERS_INFO, TELEGRAM_NOTIFICATION_ROUTES_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { errorHandler } from '@common/helpers/error-handler.helper';
import {
    CreateTelegramNotificationTopicsCommand,
    GetTelegramNotificationRoutesCommand,
    UpdateTelegramNotificationRoutesCommand,
} from '@libs/contracts/commands';

import {
    CreateTelegramNotificationTopicsResponseDto,
    GetTelegramNotificationRoutesResponseDto,
    UpdateTelegramNotificationRoutesRequestDto,
    UpdateTelegramNotificationRoutesResponseDto,
} from './dto/telegram-notification-routes.dto';
import { TelegramNotificationRoutesService } from './telegram-notification-routes.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.TELEGRAM_NOTIFICATION_ROUTES.tag)
@Roles(ROLE.ADMIN)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(TELEGRAM_NOTIFICATION_ROUTES_CONTROLLER)
export class TelegramNotificationRoutesController {
    constructor(
        private readonly telegramNotificationRoutesService: TelegramNotificationRoutesService,
    ) {}

    @ApiOkResponse({
        type: GetTelegramNotificationRoutesResponseDto,
        description: 'Telegram notification routes retrieved successfully',
    })
    @Endpoint({
        command: GetTelegramNotificationRoutesCommand,
        httpCode: HttpStatus.OK,
    })
    async getRoutes(): Promise<GetTelegramNotificationRoutesResponseDto> {
        const result = await this.telegramNotificationRoutesService.getSettingsFromController();
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({
        type: UpdateTelegramNotificationRoutesResponseDto,
        description: 'Telegram notification routes updated successfully',
    })
    @Endpoint({
        command: UpdateTelegramNotificationRoutesCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateTelegramNotificationRoutesRequestDto,
    })
    async updateRoutes(
        @Body() body: UpdateTelegramNotificationRoutesRequestDto,
    ): Promise<UpdateTelegramNotificationRoutesResponseDto> {
        const result = await this.telegramNotificationRoutesService.updateSettingsFromController(body);
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({
        type: CreateTelegramNotificationTopicsResponseDto,
        description: 'Telegram forum topics created successfully',
    })
    @Endpoint({
        command: CreateTelegramNotificationTopicsCommand,
        httpCode: HttpStatus.OK,
    })
    async createTopics(): Promise<CreateTelegramNotificationTopicsResponseDto> {
        const result = await this.telegramNotificationRoutesService.createTopicsFromController();
        return { response: errorHandler(result) };
    }
}
