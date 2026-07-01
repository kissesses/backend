import { z } from 'zod';

import { POSTGRES_MANAGEMENT_ROUTES } from '../../api';
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

export namespace GetPostgresManagementGateStatusCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.GATE_STATUS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.GATE_STATUS,
        'get',
        'Get PostgreSQL management gate status',
        { scope: 'gate-status', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: GateStatusSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace RequestPostgresManagementCodeCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.REQUEST_CODE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.REQUEST_CODE,
        'post',
        'Request Telegram verification code for PostgreSQL management',
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

export namespace VerifyPostgresManagementCodeCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.VERIFY_CODE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.VERIFY_CODE,
        'post',
        'Verify Telegram code for PostgreSQL management access',
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

export namespace VerifyPostgresManagementPasswordCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.VERIFY_PASSWORD;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.VERIFY_PASSWORD,
        'post',
        'Verify password for PostgreSQL management access',
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

export namespace GetPostgresManagementPasskeyOptionsCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.PASSKEY_OPTIONS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.PASSKEY_OPTIONS,
        'get',
        'Get passkey options for PostgreSQL management access',
        { scope: 'passkey-options', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.unknown(),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace VerifyPostgresManagementPasskeyCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.PASSKEY_VERIFY;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.PASSKEY_VERIFY,
        'post',
        'Verify passkey for PostgreSQL management access',
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

export namespace PreparePostgresManagementOAuthCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.OAUTH_PREPARE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.OAUTH_PREPARE,
        'post',
        'Prepare OAuth elevation for PostgreSQL management',
        { scope: 'oauth-prepare', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            prepared: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace ConfirmPostgresManagementOAuthCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.OAUTH_CONFIRM;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.OAUTH_CONFIRM,
        'post',
        'Confirm OAuth elevation for PostgreSQL management',
        { scope: 'oauth-confirm', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            elevatedUntil: z.string().datetime(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace GetPostgresTablesCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.TABLES;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.TABLES,
        'get',
        'List PostgreSQL tables in public schema',
        { scope: 'tables', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            tables: z.array(z.string()),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace AnalyzePostgresQueryCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.ANALYZE_QUERY;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.ANALYZE_QUERY,
        'post',
        'Analyze PostgreSQL query requirements',
        { scope: 'analyze-query', kind: 'read' },
    );

    export const RequestSchema = z.object({
        sql: z.string().min(1).max(100_000),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            classification: z.enum(['read', 'confirmation_required', 'forbidden']),
            operation: z.string().nullable(),
            requiresTelegramConfirmation: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace RequestPostgresQueryConfirmationCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.REQUEST_CONFIRMATION;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.REQUEST_CONFIRMATION,
        'post',
        'Request Telegram confirmation for destructive PostgreSQL query',
        { scope: 'request-confirmation', kind: 'write' },
    );

    export const RequestSchema = z.object({
        sql: z.string().min(1).max(100_000),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            confirmationId: z.string().uuid(),
            operation: z.string(),
            expiresInSeconds: z.number().int().positive(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace VerifyPostgresQueryConfirmationCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.VERIFY_CONFIRMATION;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.VERIFY_CONFIRMATION,
        'post',
        'Verify Telegram confirmation for destructive PostgreSQL query',
        { scope: 'verify-confirmation', kind: 'write' },
    );

    export const RequestSchema = z.object({
        confirmationId: z.string().uuid(),
        code: z.string().min(4).max(12),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            confirmationToken: z.string().uuid(),
            expiresInSeconds: z.number().int().positive(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace ExecutePostgresQueryCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.EXECUTE_QUERY;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.EXECUTE_QUERY,
        'post',
        'Execute PostgreSQL query',
        { scope: 'execute-query', kind: 'write' },
    );

    export const RequestSchema = z.object({
        sql: z.string().min(1).max(100_000),
        confirmationToken: z.string().uuid().optional(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.discriminatedUnion('kind', [
            z.object({
                kind: z.literal('rows'),
                columns: z.array(z.string()),
                rows: z.array(z.record(z.string(), z.unknown())),
                rowCount: z.number().int().nonnegative(),
                truncated: z.boolean(),
            }),
            z.object({
                kind: z.literal('command'),
                rowCount: z.number().int().nonnegative(),
            }),
        ]),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace RevokePostgresManagementGateCommand {
    export const url = REST_API.POSTGRES_MANAGEMENT.REVOKE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        POSTGRES_MANAGEMENT_ROUTES.REVOKE,
        'post',
        'Revoke PostgreSQL management elevation',
        { scope: 'gate-revoke', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            revoked: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
