import { CleanOldUsageRecordsTask } from './clean-old-usage-records/clean-old-usage-records.task';
import { DatabaseBackupTask } from './database-backup/database-backup.task';
import { VacuumTablesTask } from './vacuum-tables/vacuum-tables.task';

export const SERVICE_JOBS_TASKS = [CleanOldUsageRecordsTask, DatabaseBackupTask, VacuumTablesTask];
