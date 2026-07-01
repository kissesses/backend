import { Job } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { TruncateNodesUserUsageHistoryCommand } from '@modules/nodes-user-usage-history/commands/truncate-nodes-user-usage-history';
import { VacuumNodesUserUsageHistoryCommand } from '@modules/nodes-user-usage-history/commands/vacuum-nodes-user-usage-history';

import { UsersQueuesService } from '@queue/_users';

import { DatabaseBackupService } from '@modules/database-backup/database-backup.service';
import { TelegramNotificationRoutesService } from '@modules/telegram-notification-routes/telegram-notification-routes.service';

import { QUEUES_NAMES } from '../queue.enum';
import { ServiceJobNames } from './enums';

@Processor(QUEUES_NAMES.SERVICE, {
    concurrency: 1,
})
export class ServiceQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(ServiceQueueProcessor.name);

    constructor(
        private readonly commandBus: CommandBus,
        private readonly usersQueuesService: UsersQueuesService,
        private readonly databaseBackupService: DatabaseBackupService,
        private readonly telegramRoutesService: TelegramNotificationRoutesService,
    ) {
        super();
    }

    async process(job: Job) {
        switch (job.name) {
            case ServiceJobNames.CLEAN_OLD_USAGE_RECORDS:
                return await this.handleCleanOldUsageRecordsJob();
            case ServiceJobNames.VACUUM_TABLES:
                return await this.handleVacuumTablesJob();
            case ServiceJobNames.RUN_DATABASE_BACKUP:
                return await this.handleDatabaseBackupJob(job);
            default:
                this.logger.warn(`Job "${job.name}" is not handled.`);
                break;
        }
    }

    private async handleCleanOldUsageRecordsJob() {
        try {
            await this.usersQueuesService.queues.updateUsersUsage.pause();

            this.logger.log('Resetting tables...');

            await this.commandBus.execute(new TruncateNodesUserUsageHistoryCommand());

            await this.commandBus.execute(new VacuumNodesUserUsageHistoryCommand());

            this.logger.log('Tables resetted');
        } catch (error) {
            this.logger.error(
                `Error handling "${ServiceJobNames.CLEAN_OLD_USAGE_RECORDS}" job: ${error}`,
            );
        } finally {
            await this.usersQueuesService.queues.updateUsersUsage.resume();
        }
    }

    private async handleVacuumTablesJob() {
        try {
            await this.commandBus.execute(new VacuumNodesUserUsageHistoryCommand());

            this.logger.log('Tables vacuumed successfully.');
        } catch (error) {
            this.logger.error(`Error handling "${ServiceJobNames.VACUUM_TABLES}" job: ${error}`);
        }
    }

    private async handleDatabaseBackupJob(job: Job<{ trigger?: 'manual' | 'scheduled' }>) {
        try {
            await this.telegramRoutesService.loadSettingsCache();
            await this.databaseBackupService.loadSettingsCache();
            await this.databaseBackupService.executeBackupJob(job.data?.trigger ?? 'scheduled');
        } catch (error) {
            this.logger.error(`Error handling "${ServiceJobNames.RUN_DATABASE_BACKUP}" job: ${error}`);
            await this.databaseBackupService.resetBackupRunningStatus(
                'Backup job crashed before completion',
            );
        }
    }
}
