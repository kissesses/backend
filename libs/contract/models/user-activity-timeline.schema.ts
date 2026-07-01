import { z } from 'zod';

export const UserActivityTimelineEventSchema = z.object({
    id: z.number(),
    uuid: z.string().uuid(),
    userId: z.number(),
    username: z.string(),
    userUuid: z.string().uuid(),
    eventType: z.string(),
    metadata: z.record(z.unknown()).nullable(),
    requestIp: z.nullable(z.string()),
    userAgent: z.nullable(z.string()),
    nodeUuid: z.nullable(z.string().uuid()),
    occurredAt: z
        .string()
        .datetime()
        .transform((str) => new Date(str)),
});
