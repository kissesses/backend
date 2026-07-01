export const DATABASE_MANAGEMENT_CONTROLLER = 'database-management' as const;

export const DATABASE_MANAGEMENT_ROUTES = {
    GATE_STATUS: 'gate/status',
    REQUEST_CODE: 'gate/request-code',
    VERIFY_CODE: 'gate/verify-code',
    VERIFY_PASSWORD: 'gate/verify-password',
    PASSKEY_OPTIONS: 'gate/passkey/options',
    PASSKEY_VERIFY: 'gate/passkey/verify',
    OAUTH_PREPARE: 'gate/oauth/prepare',
    OAUTH_CONFIRM: 'gate/oauth/confirm',
    ARCHIVES: 'archives',
    REVOKE: 'gate/revoke',
} as const;
