export interface EntryFilterQuery {
    userId?: string;
    entityIds?: string[];
    type?: number;
}

export interface EntryIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: EntryFilterQuery | null;
}