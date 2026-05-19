import {UserFilterQuery} from './UserFilterQuery.ts';

export class UserIndexQuery {
    constructor(
        public page: number = 1,
        public limit: number = 10,
        public sort: string = 'createdAt:desc',
        public filter: UserFilterQuery | null = null
    ) {
    }
}