export interface FeedFilterQuery {
    userId?: string;
    text?: string;
    status?: number;
}

export interface FeedIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: FeedFilterQuery | null;
}