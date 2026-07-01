import { ERRORS } from '@libs/contracts/constants/errors';

import { ManagementElevationGateConfig } from './management-elevation-gate.types';

export const DATABASE_MANAGEMENT_ELEVATION_GATE_CONFIG: ManagementElevationGateConfig = {
    cachePrefix: 'db-mgmt',
    loggerName: 'DatabaseManagementGateService',
    telegramMessageTitle: 'Database management access',
    errors: {
        getGateStatus: ERRORS.GET_DATABASE_MANAGEMENT_GATE_STATUS_ERROR,
        telegramNotConfigured: ERRORS.DATABASE_MANAGEMENT_TELEGRAM_NOT_CONFIGURED,
        requestCode: ERRORS.REQUEST_DATABASE_MANAGEMENT_CODE_ERROR,
        verifyCode: ERRORS.VERIFY_DATABASE_MANAGEMENT_CODE_ERROR,
        codeExpired: ERRORS.DATABASE_MANAGEMENT_CODE_EXPIRED,
        invalidCode: ERRORS.DATABASE_MANAGEMENT_INVALID_CODE,
        verifyPassword: ERRORS.VERIFY_DATABASE_MANAGEMENT_PASSWORD_ERROR,
        verifyPasskey: ERRORS.VERIFY_DATABASE_MANAGEMENT_PASSKEY_ERROR,
        prepareOAuth: ERRORS.PREPARE_DATABASE_MANAGEMENT_OAUTH_ERROR,
        confirmOAuth: ERRORS.CONFIRM_DATABASE_MANAGEMENT_OAUTH_ERROR,
    },
};

export const POSTGRES_MANAGEMENT_ELEVATION_GATE_CONFIG: ManagementElevationGateConfig = {
    cachePrefix: 'postgres-mgmt',
    loggerName: 'PostgresManagementGateService',
    telegramMessageTitle: 'PostgreSQL management access',
    errors: {
        getGateStatus: ERRORS.GET_POSTGRES_MANAGEMENT_GATE_STATUS_ERROR,
        telegramNotConfigured: ERRORS.POSTGRES_MANAGEMENT_TELEGRAM_NOT_CONFIGURED,
        requestCode: ERRORS.REQUEST_POSTGRES_MANAGEMENT_CODE_ERROR,
        verifyCode: ERRORS.VERIFY_POSTGRES_MANAGEMENT_CODE_ERROR,
        codeExpired: ERRORS.POSTGRES_MANAGEMENT_CODE_EXPIRED,
        invalidCode: ERRORS.POSTGRES_MANAGEMENT_INVALID_CODE,
        verifyPassword: ERRORS.VERIFY_POSTGRES_MANAGEMENT_PASSWORD_ERROR,
        verifyPasskey: ERRORS.VERIFY_POSTGRES_MANAGEMENT_PASSKEY_ERROR,
        prepareOAuth: ERRORS.PREPARE_POSTGRES_MANAGEMENT_OAUTH_ERROR,
        confirmOAuth: ERRORS.CONFIRM_POSTGRES_MANAGEMENT_OAUTH_ERROR,
    },
};
