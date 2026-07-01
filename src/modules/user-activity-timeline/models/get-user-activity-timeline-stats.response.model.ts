export class GetUserActivityTimelineStatsResponseModel {
    public readonly byEventType: { eventType: string; count: number }[];
    public readonly hourlyEventStats: { dateTime: Date; eventCount: number }[];

    constructor(data: GetUserActivityTimelineStatsResponseModel) {
        this.byEventType = data.byEventType;
        this.hourlyEventStats = data.hourlyEventStats;
    }
}
