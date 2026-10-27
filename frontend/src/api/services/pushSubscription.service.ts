import { api } from '../client';
import type { components, operations } from '../schema';

export type PushSubscriptionResource = components['schemas']['PushSubscriptionResource'];
export type PushSubscriptionDto = components['schemas']['PushSubscriptionDto'];
export type PushSubscriptionFilterDto = components['schemas']['PushSubscriptionFilterDto'];

export type GetPushSubscriptionsQuery = operations['get_push_subscription_index']['parameters']['query'];

export type GetPushSubscriptionsResponse =
    operations['get_push_subscription_index']['responses'][200]['content']['application/json'];
export type CreatePushSubscriptionResponse =
    operations['post_push_subscription_create']['responses'][201]['content']['application/json'];
export type GetPushSubscriptionResponse =
    operations['get_push_subscription_details']['responses'][200]['content']['application/json'];
export type UpdatePushSubscriptionResponse =
    operations['put_push_subscription_update']['responses'][200]['content']['application/json'];
export type DeletePushSubscriptionResponse =
    operations['delete_push_subscription_delete']['responses'][200]['content']['application/json'];

export const pushSubscriptionService = {
    async getPushSubscriptions(query?: GetPushSubscriptionsQuery): Promise<GetPushSubscriptionsResponse> {
        const res = await api.GET('/api/push-subscriptions', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createPushSubscription(body: PushSubscriptionDto): Promise<CreatePushSubscriptionResponse> {
        const res = await api.POST('/api/push-subscriptions', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async getPushSubscription(id: string): Promise<GetPushSubscriptionResponse> {
        const res = await api.GET('/api/push-subscriptions/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updatePushSubscription(id: string, body: PushSubscriptionDto): Promise<UpdatePushSubscriptionResponse> {
        const res = await api.PUT('/api/push-subscriptions/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deletePushSubscription(id: string): Promise<DeletePushSubscriptionResponse> {
        const res = await api.DELETE('/api/push-subscriptions/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers
    async getSubscriptions(query?: GetPushSubscriptionsQuery): Promise<GetPushSubscriptionsResponse> {
        return await pushSubscriptionService.getPushSubscriptions(query);
    },

    async createSubscription(body: PushSubscriptionDto): Promise<CreatePushSubscriptionResponse> {
        return await pushSubscriptionService.createPushSubscription(body);
    },

    async deleteSubscription(id: string): Promise<DeletePushSubscriptionResponse> {
        return await pushSubscriptionService.deletePushSubscription(id);
    },
};
