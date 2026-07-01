import { z } from 'zod';

import { DATABASE_MANAGEMENT_ROUTES } from '../../api';
import { REST_API } from '../../api/routes';
import { getEndpointDetails, OAUTH2_PROVIDERS } from '../../constants';

const AlternativeMethodsSchema = z.object({
    passkey: z.boolean(),
    password: z.boolean(),
    oauth2: z.record(z.nativeEnum(OAUTH2_PROVIDERS), z.boolean()),
});

const GateStatusSchema = z.object({
    isElevated: z.boolean(),
    elevatedUntil: z.string().datetime().nullable(),
    authMode: z.enum(['telegram', 'alternative']),
    telegramConfigured: z.boolean(),
    alternativeMethods: AlternativeMethodsSchema,
});

export namespace GetDatabaseManagementGateStatusCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.GATE_STATUS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.GATE_STATUS,
        'get',
        'Get database management gate status',
        { scope: 'gate-status', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: GateStatusSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace RequestDatabaseManagementCodeCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.REQUEST_CODE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.REQUEST_CODE,
        'post',
        'Request Telegram verification code for database management',
        { scope: 'request-code', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            sent: z.boolean(),
            expiresInSeconds: z.number().int().positive(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace VerifyDatabaseManagementCodeCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.VERIFY_CODE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.VERIFY_CODE,
        'post',
        'Verify Telegram code for database management access',
        { scope: 'verify-code', kind: 'write' },
    );

    export const RequestSchema = z.object({
        code: z.string().min(4).max(12),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            elevatedUntil: z.string().datetime(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace VerifyDatabaseManagementPasswordCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.VERIFY_PASSWORD;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.VERIFY_PASSWORD,
        'post',
        'Verify admin password for database management access',
        { scope: 'verify-password', kind: 'write' },
    );

    export const RequestSchema = z.object({
        password: z.string().min(1),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            elevatedUntil: z.string().datetime(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace GetDatabaseManagementPasskeyOptionsCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.PASSKEY_OPTIONS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.PASSKEY_OPTIONS,
        'get',
        'Get passkey options for database management access',
        { scope: 'passkey-options', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.unknown(),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace VerifyDatabaseManagementPasskeyCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.PASSKEY_VERIFY;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.PASSKEY_VERIFY,
        'post',
        'Verify passkey for database management access',
        { scope: 'passkey-verify', kind: 'write' },
    );

    export const RequestSchema = z.object({
        response: z.unknown(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            elevatedUntil: z.string().datetime(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace PrepareDatabaseManagementOAuthCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.OAUTH_PREPARE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.OAUTH_PREPARE,
        'post',
        'Prepare OAuth re-authentication for database management access',
        { scope: 'oauth-prepare', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            prepared: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace ConfirmDatabaseManagementOAuthCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.OAUTH_CONFIRM;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.OAUTH_CONFIRM,
        'post',
        'Confirm OAuth re-authentication for database management access',
        { scope: 'oauth-confirm', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            elevatedUntil: z.string().datetime(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace GetDatabaseManagementArchivesCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.ARCHIVES;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.ARCHIVES,
        'get',
        'List local database backup archives',
        { scope: 'archives', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            storageDir: z.string().nullable(),
            archives: z.array(
                z.object({
                    fileName: z.string(),
                    sizeBytes: z.number().int().nonnegative(),
                    createdAt: z.string().datetime(),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace RevokeDatabaseManagementGateCommand {
    export const url = REST_API.DATABASE_MANAGEMENT.REVOKE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        DATABASE_MANAGEMENT_ROUTES.REVOKE,
        'post',
        'Revoke database management elevation',
        { scope: 'gate-revoke', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            revoked: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
