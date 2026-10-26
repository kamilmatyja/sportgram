import { api } from '../client';
import type { components } from '../schema';

export type PushSubscriptionResource = components['schemas']['PushSubscriptionResource'];
export type PushSubscriptionDto = components['schemas']['PushSubscriptionDto'];

export interface GetPushSubscriptionsParams {
    page?: number;
    limit?: number;
}

export const pushSubscriptionService = {
    async getSubscriptions(params?: GetPushSubscriptionsParams) {
        const res = await api.GET('/api/push-subscriptions', {
            params: {
                query: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 10,
                    sort: 'createdAt:desc',
                },
            },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createSubscription(body: PushSubscriptionDto) {
        const res = await api.POST('/api/push-subscriptions', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteSubscription(id: string) {
        const res = await api.DELETE('/api/push-subscriptions/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
