export interface EventListFilterQuery {
    userId?: string;
    status?: number;
}

export interface EventListIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: EventListFilterQuery | null;
}