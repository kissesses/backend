import { z } from 'zod';

import { AUTH_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';

export namespace LogoutCommand {
    export const url = REST_API.AUTH.LOGOUT;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        AUTH_ROUTES.LOGOUT,
        'post',
        'Logout admin session',
        { scope: 'logout', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: z.object({
            success: z.literal(true),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
