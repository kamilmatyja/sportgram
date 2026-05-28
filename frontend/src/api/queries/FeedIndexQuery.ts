import {FeedFilterQuery} from './FeedFilterQuery';

export class FeedIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: FeedFilterQuery | null = null;
    include: string[] = [];
}