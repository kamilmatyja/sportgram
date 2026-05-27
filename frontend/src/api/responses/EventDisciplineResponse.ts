import {EventDisciplineDistanceResponse} from './EventDisciplineDistanceResponse';

export class EventDisciplineResponse {
    id!: string;
    eventId!: string;
    createdAt!: string;
    updatedAt!: string;
    discipline!: number;
    distances!: EventDisciplineDistanceResponse[];
}