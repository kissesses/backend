import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DatabaseManagementController } from './database-management.controller';
import { DatabaseManagementModule } from './database-management.module';

@Module({
    imports: [CqrsModule, DatabaseManagementModule],
    controllers: [DatabaseManagementController],
})
export class DatabaseManagementApiModule {}
