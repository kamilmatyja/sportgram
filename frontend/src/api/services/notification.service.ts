import { api } from '../client';
import type { components, operations } from '../schema';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';

export type NotificationResource = components['schemas']['NotificationResource'];
export type NotificationFilterDto = components['schemas']['NotificationFilterDto'];
export type NotificationStatusDto = components['schemas']['NotificationStatusDto'];

export type GetNotificationsQuery = operations['get_notification_index']['parameters']['query'];

export type GetNotificationsResponse =
    operations['get_notification_index']['responses'][200]['content']['application/json'];
export type GetNotificationResponse =
    operations['get_notification_details']['responses'][200]['content']['application/json'];
export type DeleteNotificationResponse =
    operations['delete_notification_delete']['responses'][200]['content']['application/json'];
export type UpdateNotificationStatusResponse =
    operations['patch_notification_update_status']['responses'][200]['content']['application/json'];

export const notificationService = {
    async getNotifications(query?: GetNotificationsQuery): Promise<GetNotificationsResponse> {
        const res = await api.GET('/api/notifications', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getNotification(id: string): Promise<GetNotificationResponse> {
        const res = await api.GET('/api/notifications/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteNotification(id: string): Promise<DeleteNotificationResponse> {
        const res = await api.DELETE('/api/notifications/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateNotificationStatus(
        id: string,
        bodyOrStatus: NotificationStatusDto | NotificationStatusEnum,
    ): Promise<UpdateNotificationStatusResponse> {
        const body: NotificationStatusDto =
            typeof bodyOrStatus === 'number'
                ? { status: bodyOrStatus as NotificationStatusDto['status'] }
                : bodyOrStatus;
        const res = await api.PATCH('/api/notifications/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers
    async markAsRead(id: string): Promise<UpdateNotificationStatusResponse> {
        return await notificationService.updateNotificationStatus(id, NotificationStatusEnum.READ);
    },
};
