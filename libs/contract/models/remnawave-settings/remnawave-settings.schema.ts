import { z } from 'zod';

import { BrandingSettingsSchema } from './branding-settings.schema';
import { Oauth2SettingsSchema } from './oauth2-settings.schema';
import { PanelStartedNotificationSettingsSchema } from './panel-started-notification-settings.schema';
import { PasskeySettingsSchema } from './passkey-settings.schema';
import { PasswordAuthSettingsSchema } from './password-auth-settings.schema';
import { StealthLoginSettingsSchema } from './stealth-login-settings.schema';

export const RemnawaveSettingsSchema = z.object({
    passkeySettings: z.nullable(PasskeySettingsSchema),
    oauth2Settings: z.nullable(Oauth2SettingsSchema),
    passwordSettings: z.nullable(PasswordAuthSettingsSchema),
    brandingSettings: z.nullable(BrandingSettingsSchema),
    panelStartedNotificationSettings: z.nullable(PanelStartedNotificationSettingsSchema),
    stealthLoginSettings: z.nullable(StealthLoginSettingsSchema),
});

export type TRemnawaveSettings = z.infer<typeof RemnawaveSettingsSchema>;
