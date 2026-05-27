import {PageFollowFilterQuery} from './PageFollowFilterQuery';

export class PageFollowIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: PageFollowFilterQuery | null = null;
}