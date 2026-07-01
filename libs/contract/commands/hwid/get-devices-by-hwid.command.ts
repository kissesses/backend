import { z } from 'zod';

import { HWID_ROUTES, REST_API } from '../../api';
import { getEndpointDetails } from '../../constants';
import { HwidUserDeviceSchema } from '../../models';

export namespace GetDevicesByHwidCommand {
    export const url = REST_API.HWID.GET_DEVICES_BY_HWID;
    export const TSQ_url = url(':hwid');

    export const endpointDetails = getEndpointDetails(
        HWID_ROUTES.GET_DEVICES_BY_HWID(':hwid'),
        'get',
        'Get all user devices by HWID',
        { scope: 'list-by-hwid', kind: 'read' },
    );

    export const RequestSchema = z.object({
        hwid: z.string().min(1),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            devices: z.array(HwidUserDeviceSchema),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
