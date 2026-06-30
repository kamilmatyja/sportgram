import { EventDisciplineResponse } from './EventDisciplineResponse';

export class EventResponse {
    id!: string;
    pageParticipantId!: string;
    createdAt!: string;
    updatedAt!: string;
    startedAt!: string;
    endedAt!: string;
    title!: string;
    description!: string;
    link!: string;
    rules!: string;
    photo!: string;
    location!: string;
    status!: number;
    disciplines!: EventDisciplineResponse[];
}
