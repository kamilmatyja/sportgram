import { api } from '../client';
import type { components, operations } from '../schema';
import { ConversationStatusEnum } from '../../enums/ConversationStatusEnum';

export type ConversationResource = components['schemas']['ConversationResource'];
export type ConversationDto = components['schemas']['ConversationDto'];
export type ConversationStatusDto = components['schemas']['ConversationStatusDto'];
export type ConversationActivityResource = components['schemas']['ConversationActivityResource'];
export type ConversationFilterDto = components['schemas']['ConversationFilterDto'];
export type ConversationActivityFilterDto = components['schemas']['ConversationActivityFilterDto'];

export type GetConversationsQuery = operations['get_conversation_index']['parameters']['query'];
export type GetConversationActivitiesQuery = operations['get_conversation_activity_index']['parameters']['query'];

export type GetConversationsResponse =
    operations['get_conversation_index']['responses'][200]['content']['application/json'];
export type GetConversationResponse =
    operations['get_conversation_details']['responses'][200]['content']['application/json'];
export type UpdateConversationResponse =
    operations['put_conversation_update']['responses'][200]['content']['application/json'];
export type DeleteConversationResponse =
    operations['delete_conversation_delete']['responses'][200]['content']['application/json'];
export type UpdateConversationStatusResponse =
    operations['patch_conversation_update_status']['responses'][200]['content']['application/json'];
export type CreateConversationResponse =
    operations['post_conversation_create']['responses'][201]['content']['application/json'];
export type GetConversationActivitiesResponse =
    operations['get_conversation_activity_index']['responses'][200]['content']['application/json'];
export type GetActivityDetailsResponse =
    operations['get_conversation_activity_details']['responses'][200]['content']['application/json'];
export type TouchActivityResponse =
    operations['patch_conversation_activity_update_updated_at']['responses'][200]['content']['application/json'];

export const conversationService = {
    async getConversations(query?: GetConversationsQuery): Promise<GetConversationsResponse> {
        const res = await api.GET('/api/conversations', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getConversation(id: string): Promise<GetConversationResponse> {
        const res = await api.GET('/api/conversations/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateConversation(id: string, body: ConversationDto): Promise<UpdateConversationResponse> {
        const res = await api.PUT('/api/conversations/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteConversation(id: string): Promise<DeleteConversationResponse> {
        const res = await api.DELETE('/api/conversations/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateConversationStatus(
        id: string,
        bodyOrStatus: ConversationStatusDto | ConversationStatusEnum,
    ): Promise<UpdateConversationStatusResponse> {
        const body: ConversationStatusDto =
            typeof bodyOrStatus === 'number'
                ? { status: bodyOrStatus as ConversationStatusDto['status'] }
                : bodyOrStatus;
        const res = await api.PATCH('/api/conversations/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createConversationWithUser(targetUserId: string, body: ConversationDto): Promise<CreateConversationResponse> {
        const res = await api.POST('/api/conversation-users/{id}', {
            params: { path: { id: targetUserId } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getActivities(
        queryOrUserId?: GetConversationActivitiesQuery | string,
    ): Promise<ConversationActivityResource[]> {
        let query: GetConversationActivitiesQuery | undefined;
        if (typeof queryOrUserId === 'string') {
            query = {
                filter: { userId: queryOrUserId },
                limit: 50,
                sort: 'updatedAt:desc',
            };
        } else if (queryOrUserId) {
            query = queryOrUserId;
        } else {
            query = {
                limit: 50,
                sort: 'updatedAt:desc',
            };
        }

        const res = await api.GET('/api/conversation-activities', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data?.data ?? [];
    },

    async getActivityDetails(id: string): Promise<GetActivityDetailsResponse> {
        const res = await api.GET('/api/conversation-activity-users/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async touchActivityUpdatedAt(id: string): Promise<TouchActivityResponse> {
        const res = await api.PATCH('/api/conversation-activity-users/{id}/updated-at', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers used across views
    async getMessages(targetUserId: string): Promise<ConversationResource[]> {
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

    async sendMessage(targetUserId: string, text: string): Promise<CreateConversationResponse> {
        const res = await api.POST('/api/conversation-users/{id}', {
            params: { path: { id: targetUserId } },
            body: { text },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
