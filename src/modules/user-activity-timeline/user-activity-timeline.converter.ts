import { UserActivityEvents } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { UserActivityEventEntity } from './entities/user-activity-event.entity';

const modelToEntity = (model: UserActivityEvents): UserActivityEventEntity => {
    return new UserActivityEventEntity(model);
};

const entityToModel = (entity: UserActivityEventEntity): UserActivityEvents => {
    return {
        id: entity.id,
        uuid: entity.uuid,
        userId: entity.userId,
        eventType: entity.eventType,
        metadata: entity.metadata,
        requestIp: entity.requestIp,
        userAgent: entity.userAgent,
        nodeUuid: entity.nodeUuid,
        occurredAt: entity.occurredAt,
    };
};

@Injectable()
export class UserActivityTimelineConverter extends UniversalConverter<
    UserActivityEventEntity,
    UserActivityEvents
> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
