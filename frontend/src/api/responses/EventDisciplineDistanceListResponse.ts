import {EventDisciplineDistanceResultResponse} from './EventDisciplineDistanceResultResponse';

export interface EventDisciplineDistanceListResponse {
    id: string;
    eventDisciplineDistanceId: string;
    feedId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    status: number;
    results?: EventDisciplineDistanceResultResponse[];
}