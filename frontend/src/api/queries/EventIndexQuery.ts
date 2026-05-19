export interface EventFilterQuery {
    userId?: string;
    pageId?: string;
    link?: string;
    title?: string;
    status?: number;
}

export interface EventIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: EventFilterQuery | null;
}