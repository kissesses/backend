import { BlockedHwidEntity } from '../entities/blocked-hwid.entity';

export class BaseBlockedHwidResponseModel {
    public readonly hwid: string;
    public readonly reason: string | null;
    public readonly blockedBy: string | null;
    public readonly expiresAt: Date | null;
    public readonly createdAt: Date;

    constructor(data: BlockedHwidEntity) {
        this.hwid = data.hwid;
        this.reason = data.reason;
        this.blockedBy = data.blockedBy;
        this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        this.createdAt = new Date(data.createdAt);
    }
}
