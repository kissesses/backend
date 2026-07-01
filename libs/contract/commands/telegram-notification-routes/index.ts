import { z } from 'zod';

import { TELEGRAM_NOTIFICATION_ROUTES } from '../../api';
import { REST_API } from '../../api/routes';
import { getEndpointDetails } from '../../constants';
import { TelegramNotificationSettingsSchema } from '../../models';

export namespace GetTelegramNotificationRoutesCommand {
    export const url = REST_API.TELEGRAM_NOTIFICATION_ROUTES.GET;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        TELEGRAM_NOTIFICATION_ROUTES.GET,
        'get',
        'Get Telegram notification routes',
        { scope: 'get', kind: 'read' },
    );

    export const ResponseSchema = z.object({
        response: TelegramNotificationSettingsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace UpdateTelegramNotificationRoutesCommand {
    export const url = REST_API.TELEGRAM_NOTIFICATION_ROUTES.UPDATE;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        TELEGRAM_NOTIFICATION_ROUTES.UPDATE,
        'patch',
        'Update Telegram notification routes',
        { scope: 'update', kind: 'write' },
    );

    export const RequestSchema = TelegramNotificationSettingsSchema;

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: TelegramNotificationSettingsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}

export namespace CreateTelegramNotificationTopicsCommand {
    export const url = REST_API.TELEGRAM_NOTIFICATION_ROUTES.CREATE_TOPICS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        TELEGRAM_NOTIFICATION_ROUTES.CREATE_TOPICS,
        'post',
        'Create Telegram forum topics for notification routes',
        { scope: 'create-topics', kind: 'write' },
    );

    export const ResponseSchema = z.object({
        response: TelegramNotificationSettingsSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
