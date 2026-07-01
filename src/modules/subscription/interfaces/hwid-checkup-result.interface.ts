export interface IHwidCheckupResult {
    subscriptionAllowed: boolean;
    maxDeviceReached: boolean;
    hwidNotSupported: boolean;
    hwidBlocked: boolean;
    limitBypassed: boolean;
}
