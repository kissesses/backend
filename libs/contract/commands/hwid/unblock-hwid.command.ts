import { z } from 'zod';

import { HWID_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { HwidValueSchema } from '../../models/hwid-value.schema';

export namespace UnblockHwidCommand {
    export const url = REST_API.HWID.UNBLOCK_HWID;
    export const TSQ_url = url(':hwid');

    export const endpointDetails = getEndpointDetails(
        HWID_ROUTES.UNBLOCK_HWID(':hwid'),
        'delete',
        'Unblock HWID',
        { scope: 'unblock', kind: 'write' },
    );

    export const RequestSchema = z.object({
        hwid: HwidValueSchema,
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            isDeleted: z.boolean(),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
