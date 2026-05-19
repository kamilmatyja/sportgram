import {EventDisciplineSubDistanceResponse} from './EventDisciplineSubDistanceResponse';

export interface EventDisciplineDistanceResponse {
    id: string;
    eventDisciplineId: string;
    createdAt: string;
    updatedAt: string;
    distance: number;
    subDistances?: EventDisciplineSubDistanceResponse[];
}