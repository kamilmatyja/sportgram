export interface FriendFilterQuery {
    userIds?: string[];
    status?: number;
}

export interface FriendIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: FriendFilterQuery | null;
}