export interface PushSubscriptionResponse {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string | null;
    status: number;
}