import { EventListFilterQuery } from './EventListFilterQuery';

export class EventListIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: EventListFilterQuery | null = null;
    include: string[] = [];
}
