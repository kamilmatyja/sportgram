export interface EntryCountFilterQuery {
    entityIds?: string[];
    type?: number;
}

export interface EntryCountIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: EntryCountFilterQuery | null;
}