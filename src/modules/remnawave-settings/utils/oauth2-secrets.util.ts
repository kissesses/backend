import { TOauth2Settings } from '@libs/contracts/models';

export const MASKED_CLIENT_SECRET = '••••••••';

type OAuthProviderKey = keyof TOauth2Settings;

const OAUTH_PROVIDER_KEYS: OAuthProviderKey[] = [
    'github',
    'pocketid',
    'yandex',
    'keycloak',
    'generic',
    'telegram',
];

export function maskOAuth2SettingsForResponse(oauth2Settings: TOauth2Settings): TOauth2Settings {
    const masked: TOauth2Settings = { ...oauth2Settings };

    for (const providerKey of OAUTH_PROVIDER_KEYS) {
        const provider = oauth2Settings[providerKey];
        const hasClientSecret = Boolean(provider.clientSecret);

        Object.assign(masked, {
            [providerKey]: {
                ...provider,
                clientSecret: hasClientSecret ? MASKED_CLIENT_SECRET : null,
                hasClientSecret,
            },
        });
    }

    return masked;
}

export function mergeOAuth2SecretsOnUpdate(
    incoming: TOauth2Settings,
    existing: TOauth2Settings,
): TOauth2Settings {
    const merged: TOauth2Settings = { ...existing };

    for (const providerKey of OAUTH_PROVIDER_KEYS) {
        const providerIncoming = incoming[providerKey];
        if (!providerIncoming) {
            continue;
        }

        const providerExisting = existing[providerKey];
        const incomingSecret = providerIncoming.clientSecret;

        let clientSecret = providerExisting.clientSecret;

        if (incomingSecret === null) {
            clientSecret = null;
        } else if (
            incomingSecret &&
            incomingSecret !== MASKED_CLIENT_SECRET &&
            incomingSecret.trim() !== ''
        ) {
            clientSecret = incomingSecret;
        }

        const updated = {
            ...providerExisting,
            ...providerIncoming,
            clientSecret,
        };

        delete (updated as { hasClientSecret?: boolean }).hasClientSecret;

        Object.assign(merged, { [providerKey]: updated });
    }

    return merged;
}
