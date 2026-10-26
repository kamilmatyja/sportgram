import { api } from '../client';
import type { components } from '../schema';

export type ConversationActivityResource = components['schemas']['ConversationActivityResource'];
export type ConversationResource = components['schemas']['ConversationResource'];

export const conversationService = {
    async getActivities(userId?: string) {
        const query: Record<string, any> = {
            limit: 50,
            sort: 'updatedAt:desc',
        };
        if (userId) query.filter = { userId };

        const res = await api.GET('/api/conversation-activities', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data?.data ?? [];
    },

    async getMessages(targetUserId: string) {
        const res = await api.GET('/api/conversations', {
            params: {
                query: {
                    filter: { userId: targetUserId },
                    limit: 100,
                    sort: 'createdAt:asc',
                },
            },
        });
        if (res.error) throw res.error;
        return res.data?.data ?? [];
    },

    async sendMessage(targetUserId: string, text: string) {
        const res = await api.POST('/api/conversation-users/{id}', {
            params: { path: { id: targetUserId } },
            body: { text },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
