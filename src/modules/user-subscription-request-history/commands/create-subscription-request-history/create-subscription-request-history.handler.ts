import { ERRORS } from '@contract/constants';

import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { fail, ok } from '@common/types';

import { UserActivityTimelineWriterService } from '@modules/user-activity-timeline';

import { UserSubscriptionRequestHistoryRepository } from '../../repositories/user-subscription-request-history.repository';
import { CreateSubscriptionRequestHistoryCommand } from './create-subscription-request-history.command';

@CommandHandler(CreateSubscriptionRequestHistoryCommand)
export class CreateSubscriptionRequestHistoryHandler implements ICommandHandler<CreateSubscriptionRequestHistoryCommand> {
    public readonly logger = new Logger(CreateSubscriptionRequestHistoryHandler.name);

    constructor(
        private readonly userSubscriptionRequestHistoryRepository: UserSubscriptionRequestHistoryRepository,
        private readonly userActivityTimelineWriterService: UserActivityTimelineWriterService,
    ) {}

    async execute(command: CreateSubscriptionRequestHistoryCommand) {
        try {
            const { userSubscriptionRequestHistory } = command;

            await this.userSubscriptionRequestHistoryRepository.create(
                userSubscriptionRequestHistory,
            );

            await this.userActivityTimelineWriterService.recordSubscriptionRequest({
                userId: userSubscriptionRequestHistory.userId,
                requestIp: userSubscriptionRequestHistory.requestIp,
                userAgent: userSubscriptionRequestHistory.userAgent,
                occurredAt: userSubscriptionRequestHistory.requestAt,
            });

            return ok(userSubscriptionRequestHistory);
        } catch (error: unknown) {
            this.logger.error('Error:', {
                message: (error as Error).message,
                name: (error as Error).name,
                stack: (error as Error).stack,
                ...(error as object),
            });
            return fail(ERRORS.CREATE_USER_SUBSCRIPTION_REQUEST_HISTORY_ERROR);
        }
    }
}
