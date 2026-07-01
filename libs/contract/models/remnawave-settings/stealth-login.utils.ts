import {
    DEFAULT_STEALTH_LOGIN_SETTINGS,
    StealthLoginPublicSchema,
    StealthLoginSettingsSchema,
    TStealthLoginPublic,
    TStealthLoginSettings,
} from './stealth-login-settings.schema';

const HOTKEY_RE = /^(ctrl|shift|alt)(\+(ctrl|shift|alt))*\+[a-z0-9]$/i;

export function normalizeStealthLoginSettings(
    raw: Partial<TStealthLoginSettings> | null | undefined,
): TStealthLoginSettings {
    const parsed = StealthLoginSettingsSchema.safeParse({
        ...DEFAULT_STEALTH_LOGIN_SETTINGS,
        ...raw,
    });

    if (!parsed.success) {
        return DEFAULT_STEALTH_LOGIN_SETTINGS;
    }

    const settings = parsed.data;
    let historyPath = (settings.historyPath || '/').trim() || '/';
    if (!historyPath.startsWith('/')) {
        historyPath = `/${historyPath}`;
    }

    return {
        ...settings,
        hotkey: HOTKEY_RE.test(settings.hotkey) ? settings.hotkey.toLowerCase() : 'ctrl+b',
        historyPath: historyPath.slice(0, 64),
        secretParam: settings.secretParam?.trim() || null,
        secretValue: settings.secretValue?.trim() || null,
    };
}

export function stealthSecretQueryMatch(
    settings: TStealthLoginSettings,
    query: Record<string, string | undefined>,
): boolean {
    const param = settings.secretParam;
    const value = settings.secretValue;
    if (!param || !value) {
        return false;
    }
    return (query[param] ?? '').trim() === value;
}

export function stealthHasUnlockMethod(settings: TStealthLoginSettings): boolean {
    if (settings.hotkeyEnabled) {
        return true;
    }
    if (settings.clicksEnabled) {
        return true;
    }
    if (settings.secretParam && settings.secretValue) {
        return true;
    }
    return false;
}

export function buildStealthLoginPublicConfig(
    raw: Partial<TStealthLoginSettings> | null | undefined,
    query: Record<string, string | undefined> = {},
): TStealthLoginPublic {
    const settings = normalizeStealthLoginSettings(raw);
    const secretConfigured = Boolean(settings.secretParam && settings.secretValue);
    const revealed = settings.enabled && stealthSecretQueryMatch(settings, query);

    return StealthLoginPublicSchema.parse({
        enabled: settings.enabled,
        decoy: settings.decoy,
        hotkey: settings.hotkey,
        hotkeyEnabled: settings.hotkeyEnabled,
        clicksEnabled: settings.clicksEnabled,
        clicksCount: settings.clicksCount,
        clicksWindowMs: settings.clicksWindowMs,
        historyPath: settings.historyPath,
        secretParam: settings.secretParam,
        secretConfigured,
        hasUnlock: stealthHasUnlockMethod(settings),
        revealed,
    });
}

export function maskStealthLoginSettingsForResponse(
    settings: TStealthLoginSettings,
): TStealthLoginSettings {
    return {
        ...settings,
        secretValue: settings.secretValue ? '' : null,
    };
}

export function mergeStealthLoginSecretsOnUpdate(
    incoming: Partial<TStealthLoginSettings>,
    existing: TStealthLoginSettings,
): TStealthLoginSettings {
    const merged = normalizeStealthLoginSettings({
        ...existing,
        ...incoming,
    });

    if (incoming.secretValue === undefined || incoming.secretValue === '') {
        merged.secretValue = existing.secretValue;
    }

    return merged;
}

export function parseStealthHotkey(hotkey: string): {
    display: string;
    jsCondition: string;
    key: string;
} {
    const normalized = HOTKEY_RE.test(hotkey) ? hotkey.toLowerCase() : 'ctrl+b';
    const parts = normalized.split('+');
    const key = parts.find((part) => !['ctrl', 'shift', 'alt'].includes(part)) ?? 'b';
    const jsParts: string[] = [];
    if (parts.includes('ctrl')) {
        jsParts.push('e.ctrlKey');
    }
    if (parts.includes('shift')) {
        jsParts.push('e.shiftKey');
    }
    if (parts.includes('alt')) {
        jsParts.push('e.altKey');
    }

    return {
        key,
        jsCondition: jsParts.length ? jsParts.join('&&') : 'true',
        display: parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('+'),
    };
}
