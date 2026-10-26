import { api } from '../client';
import type { components } from '../schema';

export type NotificationResource = components['schemas']['NotificationResource'];

export interface GetNotificationsParams {
    page?: number;
    limit?: number;
    sort?: string;
}

export const notificationService = {
    async getNotifications(params?: GetNotificationsParams) {
        const res = await api.GET('/api/notifications', {
            params: {
                query: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 10,
                    sort: params?.sort ?? 'createdAt:desc',
                },
            },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async markAsRead(id: string) {
        const res = await api.PATCH('/api/notifications/{id}/status', {
            params: { path: { id } },
            body: { status: 3 }, // 3 = READ
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteNotification(id: string) {
        const res = await api.DELETE('/api/notifications/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
