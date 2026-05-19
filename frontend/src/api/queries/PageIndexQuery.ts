export interface PageFilterQuery {
    userId?: string;
    link?: string;
    title?: string;
    status?: number;
}

export interface PageIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: PageFilterQuery | null;
}