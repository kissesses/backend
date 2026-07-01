import z from 'zod';

export const STEALTH_DECOY_IDS = [
    '502_nginx',
    '404',
    '503',
    '401',
    '500',
    '429',
    'maintenance',
    'host_cloudflare_522',
    'host_cloudflare_521',
    'host_apache_403',
    'host_nginx_welcome',
    'host_iis_404',
    'host_litespeed',
    'cms_wordpress',
    'cms_parked',
    'cms_joomla',
    'cms_directory',
    'cms_registrar',
    'stub_coming_soon',
    'stub_construction',
    'stub_blank',
    'stub_ru_soon',
    'stub_ru_maintenance',
    'stub_intranet',
    'stub_loading',
    'waf_ddosguard_check',
    'waf_ddosguard_ru',
    'waf_ip_blocked',
    'waf_under_attack',
    'cloud_instance_boot',
    'cloud_k8s_pending',
    'cloud_storage_empty',
    'cloud_console_signin',
    'cloud_docker_hub',
    'game_server_offline',
    'game_maintenance',
    'game_matchmaking',
    'game_launcher_update',
    'game_ru_server',
    'game_studio',
    'game_snake',
    'game_memory',
    'game_pong',
    'game_tictactoe',
    'game_breakout',
    'game_2048',
    'game_minesweeper',
    'game_simon',
    'game_flappy',
    'game_reaction',
    'game_whack',
    'game_dino',
    'game_guess',
    'game_tetris',
] as const;

export type TStealthDecoyId = (typeof STEALTH_DECOY_IDS)[number];

const hotkeySchema = z
    .string()
    .regex(/^(ctrl|shift|alt)(\+(ctrl|shift|alt))*\+[a-z0-9]$/i)
    .default('ctrl+b');

const secretParamSchema = z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,31}$/)
    .nullable()
    .optional();

const secretValueSchema = z
    .string()
    .regex(/^[a-zA-Z0-9_-]{4,64}$/)
    .nullable()
    .optional();

export const StealthLoginSettingsSchema = z.object({
    enabled: z.boolean().default(false),
    decoy: z.enum(STEALTH_DECOY_IDS).default('502_nginx'),
    hotkey: hotkeySchema,
    hotkeyEnabled: z.boolean().default(true),
    clicksEnabled: z.boolean().default(true),
    clicksCount: z.number().int().min(2).max(12).default(4),
    clicksWindowMs: z.number().int().min(500).max(10000).default(2000),
    historyPath: z.string().min(1).max(64).default('/'),
    secretParam: secretParamSchema,
    secretValue: secretValueSchema,
});

export type TStealthLoginSettings = z.infer<typeof StealthLoginSettingsSchema>;

export const StealthLoginPublicSchema = z.object({
    enabled: z.boolean(),
    decoy: z.enum(STEALTH_DECOY_IDS),
    hotkey: z.string(),
    hotkeyEnabled: z.boolean(),
    clicksEnabled: z.boolean(),
    clicksCount: z.number(),
    clicksWindowMs: z.number(),
    historyPath: z.string(),
    secretParam: z.string().nullable(),
    secretConfigured: z.boolean(),
    hasUnlock: z.boolean(),
    revealed: z.boolean(),
});

export type TStealthLoginPublic = z.infer<typeof StealthLoginPublicSchema>;

export const DEFAULT_STEALTH_LOGIN_SETTINGS: TStealthLoginSettings = {
    enabled: false,
    decoy: '502_nginx',
    hotkey: 'ctrl+b',
    hotkeyEnabled: true,
    clicksEnabled: true,
    clicksCount: 4,
    clicksWindowMs: 2000,
    historyPath: '/',
    secretParam: null,
    secretValue: null,
};
