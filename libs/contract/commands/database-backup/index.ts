import { z } from 'zod';

import { DATABASE_BACKUP_ROUTES } from '../../api';
import { REST_API } from '../../api/routes';
import { getEndpointDetails } from '../../constants';
import { DatabaseBackupSettingsSchema } from '../../models';

export namespace GetDatabaseBackupSettingsCommand {
    export const url = REST_API.DATABASE_BACKUP.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_BACKUP_ROUTES.GET,
        'get',
        'Get database backup settings',
        { scope: 'get', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: DatabaseBackupSettingsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace UpdateDatabaseBackupSettingsCommand {
    export const url = REST_API.DATABASE_BACKUP.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_BACKUP_ROUTES.UPDATE,
        'patch',
        'Update database backup settings',
        { scope: 'update', kind: 'write' },
    );

    export const RequestSchema = DatabaseBackupSettingsSchema.omit({
        lastBackupAt: true,
        lastBackupStatus: true,
        lastBackupError: true,
        lastBackupSizeBytes: true,
        lastBackupFileName: true,
        nextScheduledBackupAt: true,
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: DatabaseBackupSettingsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace RunDatabaseBackupNowCommand {
    export const url = REST_API.DATABASE_BACKUP.RUN_NOW;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_BACKUP_ROUTES.RUN_NOW,
        'post',
        'Run database backup immediately',
        { scope: 'run', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            queued: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
