import { z } from 'zod';

export const BlockedHwidSchema = z.object({
    hwid: z.string(),
    reason: z.nullable(z.string()),
    blockedBy: z.nullable(z.string()),
    expiresAt: z
        .nullable(
            z
                .string()
                .datetime()
                .transform((str) => new Date(str)),
        )
        .optional(),
    createdAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
});

export type TBlockedHwid = z.infer<typeof BlockedHwidSchema>;
