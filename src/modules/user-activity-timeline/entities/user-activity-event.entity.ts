import { UserActivityEvents, Prisma } from '@prisma/client';

export class UserActivityEventEntity implements UserActivityEvents {
    id: bigint;
    uuid: string;
    userId: bigint;
    eventType: string;
    metadata: Prisma.JsonValue | null;
    requestIp: string | null;
    userAgent: string | null;
    nodeUuid: string | null;
    occurredAt: Date;

    constructor(event: Partial<UserActivityEvents>) {
        Object.assign(this, event);
        return this;
    }
}
