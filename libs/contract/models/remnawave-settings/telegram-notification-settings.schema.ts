import { z } from 'zod';

export const TELEGRAM_NOTIFICATION_ROUTE_CATEGORIES = [
    'users',
    'nodes',
    'crm',
    'service',
    'tblocker',
    'backup',
    'backupSecrets',
] as const;

export type TTelegramNotificationRouteCategory =
    (typeof TELEGRAM_NOTIFICATION_ROUTE_CATEGORIES)[number];

export const TELEGRAM_FORUM_TOPIC_NAMES: Record<TTelegramNotificationRouteCategory, string> = {
    users: 'Users',
    nodes: 'Nodes',
    crm: 'CRM',
    service: 'Service',
    tblocker: 'Torrent Blocker',
    backup: 'Database Backups',
    backupSecrets: 'Backup Secrets',
};

export const TelegramNotificationSettingsSchema = z.object({
    chatId: z.nullable(z.string()),
    usersTopicId: z.nullable(z.number().int().positive()),
    nodesTopicId: z.nullable(z.number().int().positive()),
    crmTopicId: z.nullable(z.number().int().positive()),
    serviceTopicId: z.nullable(z.number().int().positive()),
    tblockerTopicId: z.nullable(z.number().int().positive()),
    backupTopicId: z.nullable(z.number().int().positive()),
    backupSecretsTopicId: z.nullable(z.number().int().positive()),
});

export type TTelegramNotificationSettings = z.infer<typeof TelegramNotificationSettingsSchema>;

export const DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS: TTelegramNotificationSettings = {
    chatId: null,
    usersTopicId: null,
    nodesTopicId: null,
    crmTopicId: null,
    serviceTopicId: null,
    tblockerTopicId: null,
    backupTopicId: null,
    backupSecretsTopicId: null,
};

export function getTelegramTopicIdField(
    category: TTelegramNotificationRouteCategory,
): keyof TTelegramNotificationSettings {
    return `${category}TopicId` as keyof TTelegramNotificationSettings;
}
