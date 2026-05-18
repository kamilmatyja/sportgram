import {UserFilterDto} from './UserFilterDto';

export class UserIndexDto {
    constructor(
        public page: number = 1,
        public limit: number = 10,
        public sort: string = 'createdAt:desc',
        public filter: UserFilterDto | null = null
    ) {
    }
}