import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

import { Injectable } from '@nestjs/common';

import { BlockedHwidEntity } from '../entities/blocked-hwid.entity';
import { BlockedHwidsConverter } from '../blocked-hwids.converter';

@Injectable()
export class BlockedHwidsRepository {
    constructor(
        private readonly prisma: TransactionHost<TransactionalAdapterPrisma>,
        private readonly converter: BlockedHwidsConverter,
    ) {}

    public async create(entity: BlockedHwidEntity): Promise<BlockedHwidEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.blockedHwid.create({
            data: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async upsert(entity: BlockedHwidEntity): Promise<BlockedHwidEntity> {
        const model = this.converter.fromEntityToPrismaModel(entity);
        const result = await this.prisma.tx.blockedHwid.upsert({
            where: { hwid: entity.hwid },
            update: {
                reason: model.reason,
                blockedBy: model.blockedBy,
                expiresAt: model.expiresAt,
            },
            create: model,
        });

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async deleteByHwid(hwid: string): Promise<boolean> {
        try {
            const existing = await this.prisma.tx.blockedHwid.findFirst({
                where: {
                    hwid: {
                        equals: hwid,
                        mode: 'insensitive',
                    },
                },
            });

            if (!existing) {
                return false;
            }

            await this.prisma.tx.blockedHwid.delete({
                where: { hwid: existing.hwid },
            });
            return true;
        } catch {
            return false;
        }
    }

    public async findActiveByHwid(hwid: string): Promise<BlockedHwidEntity | null> {
        const result = await this.prisma.tx.blockedHwid.findFirst({
            where: {
                hwid: {
                    equals: hwid,
                    mode: 'insensitive',
                },
            },
        });

        if (!result) {
            return null;
        }

        if (result.expiresAt && result.expiresAt <= new Date()) {
            return null;
        }

        return this.converter.fromPrismaModelToEntity(result);
    }

    public async findAll(dto: {
        start: number;
        size: number;
    }): Promise<{ blocked: BlockedHwidEntity[]; total: number }> {
        const [blocked, total] = await Promise.all([
            this.prisma.tx.blockedHwid.findMany({
                skip: dto.start,
                take: dto.size,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.tx.blockedHwid.count(),
        ]);

        return {
            blocked: this.converter.fromPrismaModelsToEntities(blocked),
            total,
        };
    }
}
