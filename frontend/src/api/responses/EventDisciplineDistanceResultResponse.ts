import { EventDisciplineDistanceSubResultResponse } from './EventDisciplineDistanceSubResultResponse';

export class EventDisciplineDistanceResultResponse {
    id!: string;
    eventDisciplineListId!: string;
    feedId!: string;
    userId!: string;
    createdAt!: string;
    updatedAt!: string;
    time!: number;
    subResults!: EventDisciplineDistanceSubResultResponse[];
}
