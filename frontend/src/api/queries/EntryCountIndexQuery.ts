import { EntryCountFilterQuery } from './EntryCountFilterQuery';

export class EntryCountIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: EntryCountFilterQuery | null = null;
}
