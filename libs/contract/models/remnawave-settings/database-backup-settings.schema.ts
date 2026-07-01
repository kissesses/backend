import { z } from 'zod';

export const DATABASE_BACKUP_SCHEDULE_PRESETS = [
    'every_6h',
    'every_12h',
    'daily_0300',
    'daily_0600',
    'daily_1200',
    'daily_1800',
    'weekly_mon_0300',
    'weekly_wed_0300',
    'weekly_fri_0300',
    'weekly_sun_0400',
    'monthly_1st_0300',
    'custom',
] as const;

export type TDatabaseBackupSchedulePreset = (typeof DATABASE_BACKUP_SCHEDULE_PRESETS)[number];

export const DATABASE_BACKUP_SCHEDULE_CRON: Record<
    Exclude<TDatabaseBackupSchedulePreset, 'custom'>,
    string
> = {
    every_6h: '0 */6 * * *',
    every_12h: '0 */12 * * *',
    daily_0300: '0 3 * * *',
    daily_0600: '0 6 * * *',
    daily_1200: '0 12 * * *',
    daily_1800: '0 18 * * *',
    weekly_mon_0300: '0 3 * * 1',
    weekly_wed_0300: '0 3 * * 3',
    weekly_fri_0300: '0 3 * * 5',
    weekly_sun_0400: '0 4 * * 0',
    monthly_1st_0300: '0 3 1 * *',
};

export const DATABASE_BACKUP_STATUS = ['success', 'failed', 'running'] as const;

export type TDatabaseBackupStatus = (typeof DATABASE_BACKUP_STATUS)[number];

export const DatabaseBackupSettingsSchema = z.object({
    enabled: z.boolean(),
    schedulePreset: z.enum(DATABASE_BACKUP_SCHEDULE_PRESETS),
    customCronExpression: z.string().nullable(),
    notifyOnSuccess: z.boolean(),
    notifyOnFailure: z.boolean(),
    lastBackupAt: z.string().datetime().nullable(),
    lastBackupStatus: z.enum(DATABASE_BACKUP_STATUS).nullable(),
    lastBackupError: z.string().nullable(),
    lastBackupSizeBytes: z.number().int().nonnegative().nullable(),
    lastBackupFileName: z.string().nullable(),
    nextScheduledBackupAt: z.string().datetime().nullable(),
});

export type TDatabaseBackupSettings = z.infer<typeof DatabaseBackupSettingsSchema>;

export const DEFAULT_DATABASE_BACKUP_SETTINGS: TDatabaseBackupSettings = {
    enabled: false,
    schedulePreset: 'daily_0300',
    customCronExpression: null,
    notifyOnSuccess: true,
    notifyOnFailure: true,
    lastBackupAt: null,
    lastBackupStatus: null,
    lastBackupError: null,
    lastBackupSizeBytes: null,
    lastBackupFileName: null,
    nextScheduledBackupAt: null,
};

export function resolveDatabaseBackupCronExpression(
    settings: Pick<TDatabaseBackupSettings, 'schedulePreset' | 'customCronExpression'>,
): string | null {
    if (settings.schedulePreset === 'custom') {
        const custom = settings.customCronExpression?.trim();
        return custom || null;
    }

    return DATABASE_BACKUP_SCHEDULE_CRON[settings.schedulePreset];
}
