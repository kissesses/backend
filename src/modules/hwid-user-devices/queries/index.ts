import { CheckHwidExistsHandler } from './check-hwid-exists/check-hwid-exists.handler';
import { CheckHwidBlockedHandler } from './check-hwid-blocked/check-hwid-blocked.handler';
import { CountUsersDevicesHandler } from './count-users-devices/count-users-devices.handler';

export const QUERIES = [CountUsersDevicesHandler, CheckHwidExistsHandler, CheckHwidBlockedHandler];
