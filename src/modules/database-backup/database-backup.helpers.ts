import { randomBytes } from 'node:crypto';
import { CronJob } from 'cron';

import {
    resolveDatabaseBackupCronExpression,
    TDatabaseBackupSettings,
} from '@libs/contracts/models';

export function generateBackupPassword(length = 24): string {
    // Alphanumeric only — avoids 7z/Telegram HTML copy issues with !@#$%
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const bytes = randomBytes(length);
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

export function escapeTelegramHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

export function maskBackupPassword(password: string): string {
    if (password.length <= 6) {
        return '••••••';
    }

    const visibleStart = password.slice(0, 3);
    const visibleEnd = password.slice(-3);
    const hiddenLength = Math.min(Math.max(password.length - 6, 4), 12);

    return `${visibleStart}${'•'.repeat(hiddenLength)}${visibleEnd}`;
}

export function computeNextScheduledBackupAt(
    settings: Pick<TDatabaseBackupSettings, 'schedulePreset' | 'customCronExpression'>,
    from = new Date(),
): Date | null {
    const cronExpression = resolveDatabaseBackupCronExpression(settings);
    if (!cronExpression) {
        return null;
    }

    const job = CronJob.from({
        cronTime: cronExpression,
        onTick: () => {},
        start: false,
        timeZone: 'UTC',
    });

    const next = job.nextDate();
    if (!next) {
        return null;
    }

    return typeof next.toJSDate === 'function' ? next.toJSDate() : new Date(String(next));
}

export const STALE_BACKUP_RUNNING_MS = 60 * 60 * 1000;
export const STALE_BACKUP_RUNNING_WITHOUT_FILE_MS = 5 * 60 * 1000;

export function isStaleRunningBackup(
    settings: Pick<
        TDatabaseBackupSettings,
        'lastBackupStatus' | 'lastBackupAt' | 'lastBackupFileName'
    >,
    now = Date.now(),
): boolean {
    if (settings.lastBackupStatus !== 'running') {
        return false;
    }

    if (!settings.lastBackupAt) {
        return true;
    }

    const elapsedMs = now - new Date(settings.lastBackupAt).getTime();

    if (elapsedMs > STALE_BACKUP_RUNNING_MS) {
        return true;
    }

    if (!settings.lastBackupFileName && elapsedMs > STALE_BACKUP_RUNNING_WITHOUT_FILE_MS) {
        return true;
    }

    return false;
}

export function shouldRunScheduledBackup(
    settings: TDatabaseBackupSettings,
    now = new Date(),
): boolean {
    if (!settings.enabled) {
        return false;
    }

    if (settings.lastBackupStatus === 'running') {
        return false;
    }

    if (!settings.nextScheduledBackupAt) {
        return true;
    }

    return now >= new Date(settings.nextScheduledBackupAt);
}

export function buildBackupPasswordTelegramMessage(params: {
    fileName: string;
    createdAt: Date;
    password: string;
    sizeBytes: number;
}): string {
    const sizeMb = (params.sizeBytes / (1024 * 1024)).toFixed(2);
    const createdAt = params.createdAt.toISOString().replace('T', ' ').replace('.000Z', ' UTC');

    return [
        '🔐 <b>Remnawave Database Backup</b>',
        '',
        '📦 <b>Archive</b>',
        `<code>${escapeTelegramHtml(params.fileName)}</code>`,
        '',
        '🕒 <b>Created</b>',
        `<code>${escapeTelegramHtml(createdAt)}</code>`,
        '',
        '📊 <b>Size</b>',
        `<code>${escapeTelegramHtml(`${sizeMb} MB`)}</code>`,
        '',
        '🔑 <b>Archive password</b>',
        '⚠️ <i>Tap the spoiler below and copy the password from the monospace block.</i>',
        '',
        `<tg-spoiler><code>${escapeTelegramHtml(params.password)}</code></tg-spoiler>`,
        '',
        '📁 Password is sent here separately from the archive file.',
    ].join('\n');
}

export function buildBackupArchiveTelegramCaption(params: {
    fileName: string;
    createdAt: Date;
    sizeBytes: number;
}): string {
    const sizeMb = (params.sizeBytes / (1024 * 1024)).toFixed(2);
    const createdAt = params.createdAt.toISOString().replace('T', ' ').replace('.000Z', ' UTC');

    return [
        '💾 <b>Encrypted database backup</b>',
        `<code>${params.fileName}</code>`,
        `🕒 ${createdAt}`,
        `📊 ${sizeMb} MB`,
        '',
        '🔐 Password was sent to the <b>Backup Secrets</b> topic.',
        '📄 See <code>RESTORE.md</code> inside the archive.',
    ].join('\n');
}

export function buildBackupSuccessTelegramMessage(params: {
    fileName: string;
    createdAt: Date;
    sizeBytes: number;
}): string {
    const sizeMb = (params.sizeBytes / (1024 * 1024)).toFixed(2);
    const createdAt = params.createdAt.toISOString().replace('T', ' ').replace('.000Z', ' UTC');

    return [
        '✅ <b>Database backup completed</b>',
        '',
        `📦 <code>${params.fileName}</code>`,
        `🕒 <code>${createdAt}</code>`,
        `📊 <code>${sizeMb} MB</code>`,
    ].join('\n');
}

export function buildBackupFailureTelegramMessage(params: {
    error: string;
    createdAt: Date;
}): string {
    const createdAt = params.createdAt.toISOString().replace('T', ' ').replace('.000Z', ' UTC');

    return [
        '❌ <b>Database backup failed</b>',
        '',
        `🕒 <code>${createdAt}</code>`,
        '',
        `<code>${params.error.slice(0, 500)}</code>`,
    ].join('\n');
}

export function buildRestoreInstructions(storageDir?: string | null): string {
    const localStorageSection = storageDir
        ? `

## Local copy

When \`DATABASE_BACKUP_DIR\` is configured, each backup archive is also stored on disk:

\`\`\`
${storageDir}/remnawave-backup-YYYY-MM-DD_HH-mm-ss.7z
\`\`\`

Password is **not** stored on disk — retrieve it from the **Backup Secrets** Telegram topic.
`
        : '';

    return `# Remnawave Database Restore Guide

This archive contains an encrypted PostgreSQL backup of your Remnawave panel.

## Contents

- \`database.dump\` — PostgreSQL custom-format dump (pg_dump -Fc)
- \`manifest.json\` — backup metadata
- \`RESTORE.md\` — this file

## 1. Extract the archive

Use the password from the **Backup Secrets** Telegram topic:

\`\`\`bash
7z x remnawave-backup-YYYY-MM-DD_HH-mm-ss.7z
# enter archive password when prompted
\`\`\`

Alternative with \`7za\`:

\`\`\`bash
7za x remnawave-backup-YYYY-MM-DD_HH-mm-ss.7z
\`\`\`

## 2. Stop the panel

\`\`\`bash
cd /opt/remnawave
docker compose stop remnawave
\`\`\`

If you use advanced compose with separate scheduler/processor services, stop them too.

## 3. Restore PostgreSQL

### Option A — from host via docker exec (recommended)

\`\`\`bash
docker exec -i remnawave-db pg_restore \\
  -U "$POSTGRES_USER" \\
  -d "$POSTGRES_DB" \\
  --clean \\
  --if-exists \\
  --no-owner \\
  --role="$POSTGRES_USER" \\
  < database.dump
\`\`\`

### Option B — copy dump into DB container first

\`\`\`bash
docker cp database.dump remnawave-db:/tmp/database.dump
docker exec -it remnawave-db pg_restore \\
  -U postgres \\
  -d postgres \\
  --clean \\
  --if-exists \\
  --no-owner \\
  /tmp/database.dump
\`\`\`

Replace \`postgres\` / database name with values from your \`.env\` (\`POSTGRES_USER\`, \`POSTGRES_DB\`).

## 4. Start the panel

\`\`\`bash
docker compose up -d
docker compose logs -f remnawave
\`\`\`

## 5. Verify

- Open the admin panel and sign in
- Check **Management → Database Backup** for last backup status
- Confirm nodes and users are present

## Notes

- Always test restore on a staging copy before overwriting production.
- Keep archive passwords offline (password manager / vault).
- Telegram file limit is 50 MB — very large databases may require manual backup.
- Backups are created in **UTC** timezone.
${localStorageSection}`;
}
