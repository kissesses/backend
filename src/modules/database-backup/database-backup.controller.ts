import { CONTROLLERS_INFO, DATABASE_BACKUP_CONTROLLER } from '@contract/api';
import { ROLE } from '@contract/constants';

import { Body, Controller, HttpStatus, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Endpoint } from '@common/decorators/base-endpoint';
import { DatabaseManagementElevationGuard } from '@common/guards/database-management-elevation/database-management-elevation.guard';
import { Roles } from '@common/decorators/roles/roles';
import { HttpExceptionFilter } from '@common/exception/http-exception.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { RolesGuard } from '@common/guards/roles';
import { errorHandler } from '@common/helpers/error-handler.helper';
import {
    GetDatabaseBackupSettingsCommand,
    RunDatabaseBackupNowCommand,
    UpdateDatabaseBackupSettingsCommand,
} from '@libs/contracts/commands';

import { ServiceQueueService } from '@queue/service';

import {
    GetDatabaseBackupSettingsResponseDto,
    RunDatabaseBackupNowResponseDto,
    UpdateDatabaseBackupSettingsRequestDto,
    UpdateDatabaseBackupSettingsResponseDto,
} from './dto/database-backup.dto';
import { DatabaseBackupService } from './database-backup.service';

@ApiBearerAuth('Authorization')
@ApiTags(CONTROLLERS_INFO.DATABASE_BACKUP.tag)
@Roles(ROLE.ADMIN)
@UseGuards(JwtDefaultGuard, RolesGuard, DatabaseManagementElevationGuard)
@UseFilters(HttpExceptionFilter)
@Controller(DATABASE_BACKUP_CONTROLLER)
export class DatabaseBackupController {
    constructor(
        private readonly databaseBackupService: DatabaseBackupService,
        private readonly serviceQueueService: ServiceQueueService,
    ) {}

    @ApiOkResponse({
        type: GetDatabaseBackupSettingsResponseDto,
        description: 'Database backup settings retrieved successfully',
    })
    @Endpoint({
        command: GetDatabaseBackupSettingsCommand,
        httpCode: HttpStatus.OK,
    })
    async getSettings(): Promise<GetDatabaseBackupSettingsResponseDto> {
        const result = await this.databaseBackupService.getSettingsFromController();
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({
        type: UpdateDatabaseBackupSettingsResponseDto,
        description: 'Database backup settings updated successfully',
    })
    @Endpoint({
        command: UpdateDatabaseBackupSettingsCommand,
        httpCode: HttpStatus.OK,
        apiBody: UpdateDatabaseBackupSettingsRequestDto,
    })
    async updateSettings(
        @Body() body: UpdateDatabaseBackupSettingsRequestDto,
    ): Promise<UpdateDatabaseBackupSettingsResponseDto> {
        const result = await this.databaseBackupService.updateSettingsFromController(
            body as UpdateDatabaseBackupSettingsCommand.Request,
        );
        return { response: errorHandler(result) };
    }

    @ApiOkResponse({
        type: RunDatabaseBackupNowResponseDto,
        description: 'Database backup queued successfully',
    })
    @Endpoint({
        command: RunDatabaseBackupNowCommand,
        httpCode: HttpStatus.OK,
    })
    async runNow(): Promise<RunDatabaseBackupNowResponseDto> {
        errorHandler(await this.databaseBackupService.prepareManualBackup());

        try {
            await this.serviceQueueService.runDatabaseBackup({ trigger: 'manual' });
        } catch (error) {
            await this.databaseBackupService.resetBackupRunningStatus('Failed to queue backup job');
            throw error;
        }

        return { response: { queued: true } };
    }
}
