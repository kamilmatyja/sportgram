import {GoalFilterQuery} from './GoalFilterQuery';

export class GoalIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: GoalFilterQuery | null = null;
}