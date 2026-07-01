import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { DatabaseBackupService } from '@modules/database-backup/database-backup.service';

import { ServiceQueueService } from '@queue/service';

@Injectable()
export class DatabaseBackupTask {
    private static readonly CRON_NAME = 'databaseBackupTick';
    private readonly logger = new Logger(DatabaseBackupTask.name);

    constructor(
        private readonly databaseBackupService: DatabaseBackupService,
        private readonly serviceQueueService: ServiceQueueService,
    ) {}

    @Cron('* * * * *', {
        name: DatabaseBackupTask.CRON_NAME,
        waitForCompletion: true,
    })
    async handleCron() {
        try {
            await this.databaseBackupService.loadSettingsCache();

            const shouldRun = await this.databaseBackupService.tryScheduleBackup();
            if (!shouldRun) {
                return;
            }

            await this.serviceQueueService.runDatabaseBackup({ trigger: 'scheduled' });
        } catch (error) {
            this.logger.error(`Error in DatabaseBackupTask: ${error}`);
        }
    }
}
