import { BlockedHwid } from '@prisma/client';

export class BlockedHwidEntity implements BlockedHwid {
    public hwid: string;
    public reason: string | null;
    public blockedBy: string | null;
    public expiresAt: Date | null;
    public createdAt: Date;

    constructor(blockedHwid: Partial<BlockedHwid>) {
        Object.assign(this, blockedHwid);
        return this;
    }
}
