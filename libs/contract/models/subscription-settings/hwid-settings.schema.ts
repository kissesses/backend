import z from 'zod';

export const HwidSettingsSchema = z.object({
    enabled: z.boolean(),
    fallbackDeviceLimit: z.number(),
    maxDevicesAnnounce: z.nullable(
        z.string().max(200, { message: 'Announce must be less than 200 characters' }),
    ),
    /** Reserved for signed HWID epic — not enforced yet */
    requireSignedHwid: z.boolean().optional().default(false),
});

export type THwidSettings = z.infer<typeof HwidSettingsSchema>;
