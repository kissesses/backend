export const POSTGRES_MANAGEMENT_CONTROLLER = 'postgres-management' as const;

export const POSTGRES_MANAGEMENT_ROUTES = {
    GATE_STATUS: 'gate/status',
    REQUEST_CODE: 'gate/request-code',
    VERIFY_CODE: 'gate/verify-code',
    VERIFY_PASSWORD: 'gate/verify-password',
    PASSKEY_OPTIONS: 'gate/passkey/options',
    PASSKEY_VERIFY: 'gate/passkey/verify',
    OAUTH_PREPARE: 'gate/oauth/prepare',
    OAUTH_CONFIRM: 'gate/oauth/confirm',
    TABLES: 'tables',
    ANALYZE_QUERY: 'query/analyze',
    REQUEST_CONFIRMATION: 'query/request-confirmation',
    VERIFY_CONFIRMATION: 'query/verify-confirmation',
    EXECUTE_QUERY: 'query/execute',
    REVOKE: 'gate/revoke',
} as const;
