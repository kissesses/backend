import { z } from 'zod';

const nullableCustomEmojiIdSchema = z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.union([z.string().regex(/^\d+$/), z.null()]),
);

export const PanelStartedTelegramButtonSchema = z.object({
    enabled: z.boolean(),
    text: z.string().min(1).max(64),
    url: z.string().url(),
    customEmojiId: nullableCustomEmojiIdSchema,
    style: z.enum(['danger', 'success', 'primary']).nullable(),
});

export type TPanelStartedTelegramButton = z.infer<typeof PanelStartedTelegramButtonSchema>;

export const PanelStartedNotificationSettingsSchema = z.object({
    enabled: z.boolean(),
    headerEmoji: z.string().min(1).max(8),
    headerCustomEmojiId: nullableCustomEmojiIdSchema,
    hashtag: z.string().min(1).max(64),
    statusEmoji: z.string().min(1).max(8),
    statusCustomEmojiId: nullableCustomEmojiIdSchema,
    statusMessage: z.string().min(1).max(500),
    showCommunityLine: z.boolean(),
    communityEmoji: z.string().min(1).max(8),
    communityCustomEmojiId: nullableCustomEmojiIdSchema,
    communityText: z.string().min(1).max(300),
    showDocumentationLine: z.boolean(),
    documentationEmoji: z.string().min(1).max(8),
    documentationCustomEmojiId: nullableCustomEmojiIdSchema,
    documentationText: z.string().min(1).max(300),
    showButtons: z.boolean(),
    buttons: z.array(PanelStartedTelegramButtonSchema).max(3),
});

export type TPanelStartedNotificationSettings = z.infer<
    typeof PanelStartedNotificationSettingsSchema
>;

const SEPARATOR = '➖➖➖➖➖➖➖➖➖';

export function mergePanelStartedNotificationSettingsForForm(
    stored: TPanelStartedNotificationSettings | null | undefined,
): TPanelStartedNotificationSettings {
    if (!stored) {
        return DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS;
    }

    return {
        ...DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS,
        ...stored,
        buttons:
            stored.buttons && stored.buttons.length > 0
                ? stored.buttons
                : DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS.buttons,
    };
}

export function buildPanelStartedPreviewMessage(
    settings: TPanelStartedNotificationSettings,
    panelVersion = '2.8.0',
): string {
    const statusText = settings.statusMessage.split('{version}').join(panelVersion);
    const lines = [
        `${settings.headerEmoji} ${settings.hashtag}`,
        SEPARATOR,
        `${settings.statusEmoji} ${statusText}`,
    ];

    if (settings.showCommunityLine) {
        lines.push('', `${settings.communityEmoji} ${settings.communityText}`);
    }

    if (settings.showDocumentationLine) {
        lines.push(`${settings.documentationEmoji} ${settings.documentationText}`);
    }

    return lines.join('\n');
}

export const DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS: TPanelStartedNotificationSettings = {
    enabled: false,
    headerEmoji: '🌊',
    headerCustomEmojiId: null,
    hashtag: '#panel_started',
    statusEmoji: '✅',
    statusCustomEmojiId: null,
    statusMessage: 'Remnawave v{version} is up and running.',
    showCommunityLine: true,
    communityEmoji: '🦋',
    communityCustomEmojiId: null,
    communityText: 'Join community: @remnawave',
    showDocumentationLine: true,
    documentationEmoji: '📚',
    documentationCustomEmojiId: null,
    documentationText: 'Documentation: https://docs.rw',
    showButtons: true,
    buttons: [
        {
            enabled: true,
            text: 'Leave a star',
            url: 'https://github.com/remnawave/panel',
            customEmojiId: null,
            style: null,
        },
        {
            enabled: true,
            text: 'Support Remnawave',
            url: 'https://docs.rw/docs/donate/',
            customEmojiId: null,
            style: 'primary',
        },
    ],
};
