import { z } from 'zod';

import { HWID_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { HwidValueSchema } from '../../models/hwid-value.schema';

export namespace CheckHwidBlockedStatusCommand {
    export const url = REST_API.HWID.CHECK_HWID_BLOCKED_STATUS;
    export const TSQ_url = url(':hwid');

    export const endpointDetails = getEndpointDetails(
        HWID_ROUTES.CHECK_HWID_BLOCKED_STATUS(':hwid'),
        'get',
        'Check if HWID is blocked',
        { scope: 'check-blocked', kind: 'read' },
    );

    export const RequestSchema = z.object({
        hwid: HwidValueSchema,
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isBlocked: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
