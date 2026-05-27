import {EntryFilterQuery} from './EntryFilterQuery';

export class EntryIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: EntryFilterQuery | null = null;
}