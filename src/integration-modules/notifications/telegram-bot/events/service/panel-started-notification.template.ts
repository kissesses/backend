import {
    DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS,
    PanelStartedNotificationSettingsSchema,
    TPanelStartedNotificationSettings,
} from '@libs/contracts/models';

import { IInlineKeyboard } from '@queue/notifications/telegram-bot-logger/interfaces/inline-keyboard.interface';

const SEPARATOR = '➖➖➖➖➖➖➖➖➖';
const CUSTOM_EMOJI_ID_RE = /^\d+$/;

function escapeTelegramHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function isValidTelegramCustomEmojiId(value: string | null | undefined): value is string {
    const id = value?.trim();
    return Boolean(id && CUSTOM_EMOJI_ID_RE.test(id));
}

function getTelegramEmojiFallback(emoji: string): string {
    const trimmed = emoji.trim();
    if (!trimmed) {
        return '•';
    }

    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        const first = [...segmenter.segment(trimmed)][0]?.segment;
        if (first) {
            return escapeTelegramHtml(first);
        }
    }

    return escapeTelegramHtml([...trimmed][0] ?? '•');
}

function renderTelegramEmoji(emoji: string, customEmojiId: string | null): string {
    const fallback = getTelegramEmojiFallback(emoji);

    if (!isValidTelegramCustomEmojiId(customEmojiId)) {
        return fallback;
    }

    return `<tg-emoji emoji-id="${customEmojiId.trim()}">${fallback}</tg-emoji>`;
}

export function resolvePanelStartedNotificationSettings(
    stored: TPanelStartedNotificationSettings | null | undefined,
): TPanelStartedNotificationSettings {
    if (!stored?.enabled) {
        return DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS;
    }

    const parsed = PanelStartedNotificationSettingsSchema.safeParse({
        ...DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS,
        ...stored,
        enabled: true,
        buttons:
            stored.buttons && stored.buttons.length > 0
                ? stored.buttons
                : DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS.buttons,
    });

    return parsed.success ? parsed.data : DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS;
}

export function buildPanelStartedTelegramNotification(
    panelVersion: string,
    stored: TPanelStartedNotificationSettings | null | undefined,
): { message: string; keyboard?: IInlineKeyboard[] } {
    const settings = resolvePanelStartedNotificationSettings(stored);
    const useCustom = stored?.enabled === true;
    const resolved = useCustom ? settings : DEFAULT_PANEL_STARTED_NOTIFICATION_SETTINGS;

    const statusText = escapeTelegramHtml(
        resolved.statusMessage.split('{version}').join(panelVersion),
    );

    const lines = [
        `${renderTelegramEmoji(resolved.headerEmoji, resolved.headerCustomEmojiId)} <b>${escapeTelegramHtml(resolved.hashtag)}</b>`,
        SEPARATOR,
        `${renderTelegramEmoji(resolved.statusEmoji, resolved.statusCustomEmojiId)} ${statusText}`,
    ];

    if (resolved.showCommunityLine) {
        lines.push(
            '',
            `${renderTelegramEmoji(resolved.communityEmoji, resolved.communityCustomEmojiId)} ${escapeTelegramHtml(resolved.communityText)}`,
        );
    }

    if (resolved.showDocumentationLine) {
        lines.push(
            `${renderTelegramEmoji(resolved.documentationEmoji, resolved.documentationCustomEmojiId)} ${escapeTelegramHtml(resolved.documentationText)}`,
        );
    }

    const keyboard: IInlineKeyboard[] | undefined = resolved.showButtons
        ? resolved.buttons
              .filter((button) => button.enabled)
              .map((button) => ({
                  text: button.text,
                  url: button.url,
                  customEmoji: isValidTelegramCustomEmojiId(button.customEmojiId)
                      ? button.customEmojiId.trim()
                      : '',
                  ...(button.style ? { style: button.style } : {}),
              }))
        : undefined;

    return {
        message: lines.join('\n'),
        keyboard: keyboard?.length ? keyboard : undefined,
    };
}
