import { OAUTH2_PROVIDERS } from '@libs/contracts/constants';
import { ERRORS } from '@libs/contracts/constants/errors';

export const ELEVATION_TTL_SECONDS = 30 * 60;
export const CODE_TTL_SECONDS = 10 * 60;
export const PASSKEY_CHALLENGE_TTL_SECONDS = 60;
export const MAX_CODE_ATTEMPTS = 5;

export type ManagementGateAlternativeMethods = {
    passkey: boolean;
    password: boolean;
    oauth2: Record<(typeof OAUTH2_PROVIDERS)[keyof typeof OAUTH2_PROVIDERS], boolean>;
};

export type ManagementGateStatus = {
    isElevated: boolean;
    elevatedUntil: string | null;
    authMode: 'telegram' | 'alternative';
    telegramConfigured: boolean;
    alternativeMethods: ManagementGateAlternativeMethods;
};

export type ManagementElevationGateError =
    (typeof ERRORS)[keyof typeof ERRORS];

export type ManagementElevationGateErrors = {
    getGateStatus: ManagementElevationGateError;
    telegramNotConfigured: ManagementElevationGateError;
    requestCode: ManagementElevationGateError;
    verifyCode: ManagementElevationGateError;
    codeExpired: ManagementElevationGateError;
    invalidCode: ManagementElevationGateError;
    verifyPassword: ManagementElevationGateError;
    verifyPasskey: ManagementElevationGateError;
    prepareOAuth: ManagementElevationGateError;
    confirmOAuth: ManagementElevationGateError;
};

export type ManagementElevationGateConfig = {
    cachePrefix: string;
    loggerName: string;
    telegramMessageTitle: string;
    errors: ManagementElevationGateErrors;
};

export type ManagementElevationCacheKeys = {
    elevation: (adminUuid: string) => string;
    code: (adminUuid: string) => string;
    passkeyChallenge: (adminUuid: string) => string;
    oauthPending: (adminUuid: string) => string;
    codeAttempts: (adminUuid: string) => string;
};

export function createManagementElevationCacheKeys(
    cachePrefix: string,
): ManagementElevationCacheKeys {
    return {
        elevation: (adminUuid) => `${cachePrefix}:elevation:${adminUuid}`,
        code: (adminUuid) => `${cachePrefix}:code:${adminUuid}`,
        passkeyChallenge: (adminUuid) => `${cachePrefix}:passkey-challenge:${adminUuid}`,
        oauthPending: (adminUuid) => `${cachePrefix}:oauth-pending:${adminUuid}`,
        codeAttempts: (adminUuid) => `${cachePrefix}:code-attempts:${adminUuid}`,
    };
}
