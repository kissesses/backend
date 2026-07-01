import {
    TBrandingSettings,
    TOauth2Settings,
    TPanelStartedNotificationSettings,
    TPasswordAuthSettings,
    TRemnawavePasskeySettings,
    TStealthLoginSettings,
    mergePanelStartedNotificationSettingsForForm,
    maskStealthLoginSettingsForResponse,
    normalizeStealthLoginSettings,
} from '@libs/contracts/models';

import { RemnawaveSettingsEntity } from '../entities';
import { maskOAuth2SettingsForResponse } from '../utils/oauth2-secrets.util';

export class RemnawaveSettingsResponseModel {
    public passkeySettings: TRemnawavePasskeySettings;
    public oauth2Settings: TOauth2Settings;
    public passwordSettings: TPasswordAuthSettings;
    public brandingSettings: TBrandingSettings;
    public panelStartedNotificationSettings: TPanelStartedNotificationSettings;
    public stealthLoginSettings: TStealthLoginSettings;

    constructor(entity: RemnawaveSettingsEntity) {
        this.passkeySettings = entity.passkeySettings;
        this.oauth2Settings = maskOAuth2SettingsForResponse(entity.oauth2Settings);
        this.passwordSettings = entity.passwordSettings;
        this.brandingSettings = entity.brandingSettings;
        this.panelStartedNotificationSettings = mergePanelStartedNotificationSettingsForForm(
            entity.panelStartedNotificationSettings,
        );
        this.stealthLoginSettings = maskStealthLoginSettingsForResponse(
            normalizeStealthLoginSettings(entity.stealthLoginSettings),
        );
    }
}
