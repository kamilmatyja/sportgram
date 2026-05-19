import {PageFilterQuery} from './PageFilterQuery';

export class PageIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: PageFilterQuery | null = null;
}