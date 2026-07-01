import z from 'zod';

import { httpsUrlSchema } from '../../utils/https-url.schema';

export const BrandingSettingsSchema = z.object({
    title: z.nullable(z.string()),
    logoUrl: z.nullable(httpsUrlSchema),
});

export type TBrandingSettings = z.infer<typeof BrandingSettingsSchema>;
