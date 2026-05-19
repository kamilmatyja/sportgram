import {EventFilterQuery} from './EventFilterQuery';

export class EventIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: EventFilterQuery | null = null;
}