import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type NotificationResource = components['schemas']['NotificationResource'];
export type NotificationFilterDto = components['schemas']['NotificationFilterDto'];

export type GetNotificationsQuery = operations['get_notification_index']['parameters']['query'];
export type GetNotificationDetailsQuery = operations['get_notification_details']['parameters']['query'];

export const notificationService = {
    async getNotifications(req: ApiRequest<'get_notification_index'>): Promise<ApiResponse<'get_notification_index'>> {
        const res = await api.GET('/api/notifications', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getNotification(
        req: ApiRequest<'get_notification_details'>,
    ): Promise<ApiResponse<'get_notification_details'>> {
        const res = await api.GET('/api/notifications/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async deleteNotification(
        req: ApiRequest<'delete_notification_delete'>,
    ): Promise<ApiResponse<'delete_notification_delete'>> {
        const res = await api.DELETE('/api/notifications/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updateNotificationStatus(
        req: ApiRequest<'patch_notification_update_status'>,
    ): Promise<ApiResponse<'patch_notification_update_status'>> {
        const res = await api.PATCH('/api/notifications/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },
};
