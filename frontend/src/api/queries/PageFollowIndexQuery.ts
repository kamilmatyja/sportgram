export interface PageFollowFilterQuery {
    userId?: string;
    pageIds?: string[];
    status?: number;
}

export interface PageFollowIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: PageFollowFilterQuery | null;
}