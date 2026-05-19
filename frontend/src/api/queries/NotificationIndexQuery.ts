export interface NotificationFilterQuery {
    text?: string;
    status?: number;
}

export interface NotificationIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: NotificationFilterQuery | null;
}