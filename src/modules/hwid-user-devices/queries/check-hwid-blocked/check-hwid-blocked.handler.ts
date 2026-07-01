import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ok, TResult } from '@common/types';
import { normalizeHwid } from '@common/utils/normalize-hwid';

import { BlockedHwidsRepository } from '../../repositories/blocked-hwids.repository';
import { CheckHwidBlockedQuery } from './check-hwid-blocked.query';

@QueryHandler(CheckHwidBlockedQuery)
export class CheckHwidBlockedHandler implements IQueryHandler<
    CheckHwidBlockedQuery,
    TResult<{ isBlocked: boolean }>
> {
    private readonly logger = new Logger(CheckHwidBlockedHandler.name);

    constructor(private readonly blockedHwidsRepository: BlockedHwidsRepository) {}

    async execute(query: CheckHwidBlockedQuery): Promise<TResult<{ isBlocked: boolean }>> {
        try {
            const blocked = await this.blockedHwidsRepository.findActiveByHwid(
                normalizeHwid(query.hwid),
            );
            return ok({ isBlocked: blocked !== null });
        } catch (error) {
            this.logger.error(error);
            return ok({ isBlocked: true });
        }
    }
}
