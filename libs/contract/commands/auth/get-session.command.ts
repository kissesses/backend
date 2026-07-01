import { z } from 'zod';

import { AUTH_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace GetSessionCommand {
    export const url = REST_API.AUTH.SESSION;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        AUTH_ROUTES.SESSION,
        'get',
        'Get current admin session',
        { scope: 'session', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            authenticated: z.literal(true),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
