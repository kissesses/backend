import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { PostgresManagementController } from './postgres-management.controller';
import { PostgresManagementModule } from './postgres-management.module';

@Module({
    imports: [CqrsModule, PostgresManagementModule],
    controllers: [PostgresManagementController],
})
export class PostgresManagementApiModule {}
