import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type PushSubscriptionResource = components['schemas']['PushSubscriptionResource'];
export type PushSubscriptionDto = components['schemas']['PushSubscriptionDto'];
export type PushSubscriptionFilterDto = components['schemas']['PushSubscriptionFilterDto'];

export type GetPushSubscriptionsQuery = operations['get_push_subscription_index']['parameters']['query'];
export type GetPushSubscriptionDetailsQuery = operations['get_push_subscription_details']['parameters']['query'];

export const pushSubscriptionService = {
    async getPushSubscriptions(
        req?: ApiRequest<'get_push_subscription_index'>,
    ): Promise<ApiResponse<'get_push_subscription_index'>> {
        const res = await api.GET('/api/push-subscriptions', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_push_subscription_index'>;
    },
    async createPushSubscription(
        req?: ApiRequest<'post_push_subscription_create'>,
    ): Promise<ApiResponse<'post_push_subscription_create'>> {
        const res = await api.POST('/api/push-subscriptions', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_push_subscription_create'>;
    },
    async getPushSubscription(
        req?: ApiRequest<'get_push_subscription_details'>,
    ): Promise<ApiResponse<'get_push_subscription_details'>> {
        const res = await api.GET('/api/push-subscriptions/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_push_subscription_details'>;
    },
    async updatePushSubscription(
        req?: ApiRequest<'put_push_subscription_update'>,
    ): Promise<ApiResponse<'put_push_subscription_update'>> {
        const res = await api.PUT('/api/push-subscriptions/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_push_subscription_update'>;
    },
    async deletePushSubscription(
        req?: ApiRequest<'delete_push_subscription_delete'>,
    ): Promise<ApiResponse<'delete_push_subscription_delete'>> {
        const res = await api.DELETE('/api/push-subscriptions/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_push_subscription_delete'>;
    },
    async updatePushSubscriptionStatus(
        req?: ApiRequest<'patch_push_subscription_update_status'>,
    ): Promise<ApiResponse<'patch_push_subscription_update_status'>> {
        const res = await api.PATCH('/api/push-subscriptions/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_push_subscription_update_status'>;
    },
};
