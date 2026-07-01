export const HWID_CONTROLLER = 'hwid' as const;

export const HWID_ROUTES = {
    GET_ALL_HWID_DEVICES: 'devices', // get
    CREATE_USER_HWID_DEVICE: 'devices',
    GET_USER_HWID_DEVICES: (userUuid: string) => `devices/${userUuid}`,
    DELETE_USER_HWID_DEVICE: 'devices/delete',
    DELETE_ALL_USER_HWID_DEVICES: 'devices/delete-all',

    STATS: 'devices/stats', // get
    TOP_USERS_BY_DEVICES: 'devices/top-users', // get

    GET_BLOCKED_HWIDS: 'blocked', // get
    BLOCK_HWID: 'blocked', // post
    CHECK_HWID_BLOCKED_STATUS: (hwid: string) => `blocked/${hwid}/status`, // get
    UNBLOCK_HWID: (hwid: string) => `blocked/${hwid}`, // delete
    GET_DEVICES_BY_HWID: (hwid: string) => `devices/by-hwid/${hwid}`, // get
} as const;
