import { BlockedHwid } from '@prisma/client';

import { BlockedHwidEntity } from './entities/blocked-hwid.entity';

export class BlockedHwidsConverter {
    public fromEntityToPrismaModel(entity: BlockedHwidEntity): BlockedHwid {
        return {
            hwid: entity.hwid,
            reason: entity.reason,
            blockedBy: entity.blockedBy,
            expiresAt: entity.expiresAt,
            createdAt: entity.createdAt,
        };
    }

    public fromPrismaModelToEntity(model: BlockedHwid): BlockedHwidEntity {
        return new BlockedHwidEntity(model);
    }

    public fromPrismaModelsToEntities(models: BlockedHwid[]): BlockedHwidEntity[] {
        return models.map((model) => this.fromPrismaModelToEntity(model));
    }
}
