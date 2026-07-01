import { z } from 'zod';

import { HWID_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { BlockedHwidSchema } from '../../models';
import { HwidValueSchema } from '../../models/hwid-value.schema';

export namespace BlockHwidCommand {
    export const url = REST_API.HWID.BLOCK_HWID;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HWID_ROUTES.BLOCK_HWID,
        'post',
        'Block HWID',
        { scope: 'block', kind: 'write' },
    );

    export const RequestSchema = z.object({
        hwid: HwidValueSchema,
        reason: z.string().max(500).optional(),
        expiresAt: z.coerce.date().optional(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: BlockedHwidSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
