import {EventDisciplineDistanceResponse} from './EventDisciplineDistanceResponse';

export interface EventDisciplineResponse {
    id: string;
    eventId: string;
    createdAt: string;
    updatedAt: string;
    discipline: number;
    distances?: EventDisciplineDistanceResponse[];
}