import { RemnawaveSettings } from '@prisma/client';

import {
    TBrandingSettings,
    TOauth2Settings,
    TPanelStartedNotificationSettings,
    TPasswordAuthSettings,
    TRemnawavePasskeySettings,
} from '@libs/contracts/models';

export class RemnawaveSettingsEntity implements RemnawaveSettings {
    public id: number;
    public passkeySettings: TRemnawavePasskeySettings;
    public oauth2Settings: TOauth2Settings;
    public passwordSettings: TPasswordAuthSettings;
    public brandingSettings: TBrandingSettings;
    public panelStartedNotificationSettings: TPanelStartedNotificationSettings | null;
    public telegramNotificationSettings: RemnawaveSettings['telegramNotificationSettings'];
    public databaseBackupSettings: RemnawaveSettings['databaseBackupSettings'];

    constructor(remnawaveSettings: Partial<RemnawaveSettings>) {
        Object.assign(this, remnawaveSettings);
        return this;
    }
}
