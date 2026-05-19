import {StatisticFilterQuery} from './StatisticFilterQuery';

export class StatisticIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: StatisticFilterQuery | null = null;
}