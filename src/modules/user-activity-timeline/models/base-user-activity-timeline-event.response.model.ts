import { UserActivityTimelineRecord } from '../repositories/user-activity-timeline.repository';

export class BaseUserActivityTimelineEventResponseModel {
    public readonly id: number;
    public readonly uuid: string;
    public readonly userId: number;
    public readonly username: string;
    public readonly userUuid: string;
    public readonly eventType: string;
    public readonly metadata: Record<string, unknown> | null;
    public readonly requestIp: string | null;
    public readonly userAgent: string | null;
    public readonly nodeUuid: string | null;
    public readonly occurredAt: Date;

    constructor(data: UserActivityTimelineRecord) {
        this.id = Number(data.id);
        this.uuid = data.uuid;
        this.userId = Number(data.userId);
        this.username = data.username;
        this.userUuid = data.userUuid;
        this.eventType = data.eventType;
        this.metadata = data.metadata as Record<string, unknown> | null;
        this.requestIp = data.requestIp;
        this.userAgent = data.userAgent;
        this.nodeUuid = data.nodeUuid;
        this.occurredAt = data.occurredAt;
    }
}
