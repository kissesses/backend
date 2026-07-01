import { z } from 'zod';

import { HWID_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { BlockedHwidSchema } from '../../models';

export namespace GetBlockedHwidsCommand {
    export const url = REST_API.HWID.GET_BLOCKED_HWIDS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HWID_ROUTES.GET_BLOCKED_HWIDS,
        'get',
        'Get blocked HWIDs',
        { scope: 'list-blocked', kind: 'read' },
    );

    export const RequestQuerySchema = z.object({
        start: z.coerce.number().int().min(0).optional().default(0),
        size: z.coerce.number().int().min(1).max(500).optional().default(50),
    });

    export type RequestQuery = z.infer<typeof RequestQuerySchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            blocked: z.array(BlockedHwidSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
