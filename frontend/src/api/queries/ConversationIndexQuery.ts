export interface ConversationFilterQuery {
    userId?: string;
    status?: number;
}

export interface ConversationIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: ConversationFilterQuery | null;
}