export interface UserFilterQuery {
    firstName?: string;
    lastName?: string;
    gender?: number;
    email?: string;
    country?: number;
    status?: number;
    userIds?: string[];
    link?: string;
    signId?: string;
}

export interface UserIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: UserFilterQuery | null;
}