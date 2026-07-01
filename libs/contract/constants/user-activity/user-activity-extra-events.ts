export const USER_ACTIVITY_EXTRA_EVENTS = {
    SUBSCRIPTION_REQUEST: 'user.subscription_request',
} as const;

export type TUserActivityExtraEvents =
    (typeof USER_ACTIVITY_EXTRA_EVENTS)[keyof typeof USER_ACTIVITY_EXTRA_EVENTS];
