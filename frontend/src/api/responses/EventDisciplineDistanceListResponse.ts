import { EventDisciplineDistanceResultResponse } from './EventDisciplineDistanceResultResponse';

export class EventDisciplineDistanceListResponse {
    id!: string;
    eventDisciplineDistanceId!: string;
    feedId!: string;
    userId!: string;
    createdAt!: string;
    updatedAt!: string;
    status!: number;
    results!: EventDisciplineDistanceResultResponse[];
}
