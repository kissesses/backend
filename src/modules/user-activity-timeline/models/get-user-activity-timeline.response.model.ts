import { BaseUserActivityTimelineEventResponseModel } from './base-user-activity-timeline-event.response.model';

export class GetUserActivityTimelineResponseModel {
    public readonly total: number;
    public readonly records: BaseUserActivityTimelineEventResponseModel[];

    constructor(data: GetUserActivityTimelineResponseModel) {
        this.total = data.total;
        this.records = data.records;
    }
}
