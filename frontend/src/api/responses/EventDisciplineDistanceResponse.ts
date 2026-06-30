import { EventDisciplineSubDistanceResponse } from './EventDisciplineSubDistanceResponse';

export class EventDisciplineDistanceResponse {
    id!: string;
    eventDisciplineId!: string;
    createdAt!: string;
    updatedAt!: string;
    distance!: number;
    subDistances!: EventDisciplineSubDistanceResponse[];
}
