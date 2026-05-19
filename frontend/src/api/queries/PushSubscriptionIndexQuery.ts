export interface PushSubscriptionFilterQuery {
    endpoint?: string;
    p256dh?: string;
    auth?: string;
}

export interface PushSubscriptionIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: PushSubscriptionFilterQuery | null;
}