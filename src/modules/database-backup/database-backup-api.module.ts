import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DatabaseBackupController } from './database-backup.controller';
import { DatabaseBackupModule } from './database-backup.module';
import { DatabaseManagementModule } from '../database-management/database-management.module';

@Module({
    imports: [CqrsModule, DatabaseBackupModule, DatabaseManagementModule],
    controllers: [DatabaseBackupController],
})
export class DatabaseBackupApiModule {}
