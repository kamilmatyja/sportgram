export interface ConversationActivityFilterQuery {
    userId?: string;
}

export interface ConversationActivityIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: ConversationActivityFilterQuery | null;
}