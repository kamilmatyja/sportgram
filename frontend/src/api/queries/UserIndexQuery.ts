import {UserFilterQuery} from './UserFilterQuery';

export class UserIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: UserFilterQuery | null = null;
    include: string[] = [];
}