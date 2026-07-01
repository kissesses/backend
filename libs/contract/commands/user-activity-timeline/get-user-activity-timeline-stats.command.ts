import { z } from 'zod';

import { REST_API, USER_ACTIVITY_TIMELINE_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace GetUserActivityTimelineStatsCommand {
    export const url = REST_API.USER_ACTIVITY_TIMELINE.STATS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USER_ACTIVITY_TIMELINE_ROUTES.STATS,
        'get',
        'Get user activity timeline stats',
        { scope: 'stats', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            byEventType: z.array(
                z.object({
                    eventType: z.string(),
                    count: z.number(),
                }),
            ),
            hourlyEventStats: z.array(
                z.object({
                    dateTime: z
                        .string()
                        .datetime()
                        .transform((str) => new Date(str)),
                    eventCount: z.number(),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
