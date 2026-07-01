import { z } from 'zod';

import { REST_API, USER_ACTIVITY_TIMELINE_ROUTES } from '../../api';
import { getEndpointDetails } from '../../constants';
import { TanstackQueryRequestQuerySchema, UserActivityTimelineEventSchema } from '../../models';

export namespace GetUserActivityTimelineCommand {
    export const url = REST_API.USER_ACTIVITY_TIMELINE.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        USER_ACTIVITY_TIMELINE_ROUTES.GET,
        'get',
        'Get user activity timeline events',
        { scope: 'list', kind: 'read' },
    );

    export const RequestQuerySchema = TanstackQueryRequestQuerySchema;

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            records: z.array(UserActivityTimelineEventSchema),
            total: z.number(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
