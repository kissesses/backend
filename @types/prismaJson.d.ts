import { z } from 'zod';

import {
    Oauth2SettingsSchema,
    PasskeySettingsSchema,
    PasswordAuthSettingsSchema,
    BrandingSettingsSchema,
    TelegramNotificationSettingsSchema,
    PanelStartedNotificationSettingsSchema,
    StealthLoginSettingsSchema,
} from '@libs/contracts/models';

declare global {
    namespace PrismaJson {
        type PasskeySettings = z.infer<typeof PasskeySettingsSchema>;
        type Oauth2Settings = z.infer<typeof Oauth2SettingsSchema>;
        type PasswordAuthSettings = z.infer<typeof PasswordAuthSettingsSchema>;
        type BrandingSettings = z.infer<typeof BrandingSettingsSchema>;
        type TelegramNotificationSettings = z.infer<typeof TelegramNotificationSettingsSchema>;
        type PanelStartedNotificationSettings = z.infer<
            typeof PanelStartedNotificationSettingsSchema
        >;
        type StealthLoginSettings = z.infer<typeof StealthLoginSettingsSchema>;
    }
}

export {};
