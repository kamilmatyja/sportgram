export interface StoryFilterQuery {
    userId?: string;
    text?: string;
    status?: number;
}

export interface StoryIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: StoryFilterQuery | null;
}