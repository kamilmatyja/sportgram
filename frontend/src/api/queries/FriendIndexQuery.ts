import { FriendFilterQuery } from './FriendFilterQuery';

export class FriendIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: FriendFilterQuery | null = null;
}
