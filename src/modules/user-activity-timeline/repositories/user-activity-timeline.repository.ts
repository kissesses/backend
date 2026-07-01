import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { sql } from 'kysely';
import { Prisma } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { TxKyselyService } from '@common/database';
import { paginateQuery } from '@common/helpers';
import { ICrudWithId } from '@common/types/crud-port';
import { GetUserActivityTimelineCommand } from '@libs/contracts/commands';

import { UserActivityEventEntity } from '../entities/user-activity-event.entity';
import { UserActivityTimelineConverter } from '../user-activity-timeline.converter';

export interface UserActivityTimelineRecord extends UserActivityEventEntity {
    username: string;
    userUuid: string;
}

const TIMELINE_FILTER_COLUMN_MAP = {
    id: sql`CAST(e.id AS TEXT)`,
    uuid: sql`CAST(e.uuid AS TEXT)`,
    userId: sql`CAST(e.user_id AS TEXT)`,
    username: sql.ref('u.username'),
    userUuid: sql`CAST(u.uuid AS TEXT)`,
    eventType: sql.ref('e.event_type'),
    requestIp: sql.ref('e.request_ip'),
    userAgent: sql.ref('e.user_agent'),
    nodeUuid: sql`CAST(e.node_uuid AS TEXT)`,
    occurredAt: sql.ref('e.occurred_at'),
} as const;

type AllowedTimelineFilterId = keyof typeof TIMELINE_FILTER_COLUMN_MAP;

const TIMELINE_SORT_COLUMN_MAP: Record<string, string> = {
    id: 'e.id',
    uuid: 'e.uuid',
    userId: 'e.userId',
    username: 'u.username',
    userUuid: 'u.uuid',
    eventType: 'e.eventType',
    requestIp: 'e.requestIp',
    userAgent: 'e.userAgent',
    nodeUuid: 'e.nodeUuid',
    occurredAt: 'e.occurredAt',
};

@Injectable()
export class UserActivityTimelineRepository implements ICrudWithId<UserActivityEventEntity> {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly converter: UserActivityTimelineConverter,
        private readonly qb: TxKyselyService,
    ) {}

    public async create(entity: UserActivityEventEntity): Promise<UserActivityEventEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.userActivityEvents.create({
            data: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findByCriteria(
        dto: Partial<UserActivityEventEntity>,
    ): Promise<UserActivityEventEntity[]> {
        const list = await this.prisma.tx.userActivityEvents.findMany({
            where: dto as Prisma.UserActivityEventsWhereInput,
        });
        return this.converter.fromPrismaModelsToEntities(list);
    }

    public async findById(id: bigint | number): Promise<UserActivityEventEntity | null> {
        const result = await this.prisma.tx.userActivityEvents.findUnique({
            where: { id },
        });

        return result ? this.converter.fromPrismaModelToEntity(result) : null;
    }

    public async findFirstByCriteria(
        dto: Partial<UserActivityEventEntity>,
    ): Promise<UserActivityEventEntity | null> {
        const result = await this.prisma.tx.userActivityEvents.findFirst({
            where: dto as Prisma.UserActivityEventsWhereInput,
        });
        return result ? this.converter.fromPrismaModelToEntity(result) : null;
    }

    public async update(
        entity: UserActivityEventEntity,
    ): Promise<UserActivityEventEntity | null> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.userActivityEvents.update({
            where: { id: entity.id },
            data: model,
        });
        return this.converter.fromPrismaModelToEntity(result);
    }

    public async deleteById(id: bigint | number): Promise<boolean> {
        const result = await this.prisma.tx.userActivityEvents.delete({
            where: { id },
        });
        return !!result;
    }

    public async getAllUserActivityTimeline({
        start,
        size,
        filters,
        filterModes,
        sorting,
    }: GetUserActivityTimelineCommand.RequestQuery): Promise<[UserActivityTimelineRecord[], number]> {
        let qb = this.qb.kysely
            .selectFrom('userActivityEvents as e')
            .innerJoin('users as u', 'u.tId', 'e.userId')
            .select([
                'e.id',
                'e.uuid',
                'e.userId',
                'u.username',
                'u.uuid as userUuid',
                'e.eventType',
                'e.metadata',
                'e.requestIp',
                'e.userAgent',
                'e.nodeUuid',
                'e.occurredAt',
            ]);

        if (filters?.length) {
            qb = this.applyTimelineFilters(qb, filters, filterModes);
        }

        if (sorting?.length) {
            for (const sort of sorting) {
                const sortColumn = TIMELINE_SORT_COLUMN_MAP[sort.id] ?? 'e.occurredAt';
                qb = qb.orderBy(sortColumn as 'e.occurredAt', (ob) =>
                    (sort.desc ? ob.desc() : ob.asc()).nullsLast(),
                ) as typeof qb;
            }
        } else {
            qb = qb.orderBy('e.occurredAt', 'desc');
        }

        const { rows, count } = await paginateQuery(qb, { offset: start, limit: size });

        return [
            rows.map(
                (row) =>
                    ({
                        ...new UserActivityEventEntity({
                            id: row.id,
                            uuid: row.uuid,
                            userId: row.userId,
                            eventType: row.eventType,
                            metadata: row.metadata,
                            requestIp: row.requestIp,
                            userAgent: row.userAgent,
                            nodeUuid: row.nodeUuid,
                            occurredAt: row.occurredAt,
                        }),
                        username: row.username,
                        userUuid: row.userUuid,
                    }) satisfies UserActivityTimelineRecord,
            ),
            count,
        ];
    }

    private applyTimelineFilters(
        qb: any,
        filters: GetUserActivityTimelineCommand.RequestQuery['filters'],
        filterModes?: GetUserActivityTimelineCommand.RequestQuery['filterModes'],
    ) {
        for (const filter of filters ?? []) {
            if (!(filter.id in TIMELINE_FILTER_COLUMN_MAP)) continue;

            const column = TIMELINE_FILTER_COLUMN_MAP[filter.id as AllowedTimelineFilterId];
            const mode = filterModes?.[filter.id] ?? 'contains';

            if (filter.id === 'occurredAt') {
                qb = qb.where(column, '=', new Date(filter.value as string));
                continue;
            }

            if (
                filter.id === 'id' ||
                filter.id === 'userId' ||
                filter.id === 'uuid' ||
                filter.id === 'userUuid' ||
                filter.id === 'nodeUuid'
            ) {
                try {
                    if (filter.id === 'id' || filter.id === 'userId') {
                        BigInt(filter.value as string);
                    }
                    qb = qb.where(column, 'ilike', `%${filter.value}%`);
                } catch {
                    qb = qb.where('e.id', 'is', null);
                }
                continue;
            }

            if (filter.id === 'eventType') {
                qb = qb.where(column, '=', filter.value);
                continue;
            }

            switch (mode) {
                case 'equals':
                    qb = qb.where(column, '=', filter.value);
                    break;
                case 'startsWith':
                    qb = qb.where(column, 'ilike', `${filter.value}%`);
                    break;
                case 'endsWith':
                    qb = qb.where(column, 'ilike', `%${filter.value}`);
                    break;
                default:
                    qb = qb.where(column, 'ilike', `%${filter.value}%`);
            }
        }

        return qb;
    }

    public async getUserActivityTimelineStats(): Promise<{
        byEventType: { eventType: string; count: number }[];
    }> {
        const eventStats = await this.qb.kysely
            .selectFrom('userActivityEvents')
            .select(['eventType', (eb) => eb.fn.count('id').as('count')])
            .groupBy('eventType')
            .orderBy('count', 'desc')
            .execute();

        return {
            byEventType: eventStats.map((stat) => ({
                eventType: stat.eventType,
                count: Number(stat.count),
            })),
        };
    }

    public async getHourlyEventStats(): Promise<{ dateTime: Date; eventCount: number }[]> {
        const result = await this.qb.kysely
            .selectFrom('userActivityEvents')
            .select([
                sql<Date>`date_trunc('hour', occurred_at)`.as('hour'),
                (eb) => eb.fn.count('id').as('eventCount'),
            ])
            .where('occurredAt', '>=', sql<Date>`NOW() - INTERVAL '48 hours'`)
            .groupBy(sql`date_trunc('hour', occurred_at)`)
            .orderBy('hour')
            .execute();

        return result.map((row) => ({
            dateTime: row.hour,
            eventCount: Number(row.eventCount),
        }));
    }
}
