import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type ConversationResource = components['schemas']['ConversationResource'];
export type ConversationDto = components['schemas']['ConversationDto'];
export type ConversationFilterDto = components['schemas']['ConversationFilterDto'];
export type ConversationActivityResource = components['schemas']['ConversationActivityResource'];

export type GetConversationsQuery = operations['get_conversation_index']['parameters']['query'];
export type GetConversationDetailsQuery = operations['get_conversation_details']['parameters']['query'];
export type GetConversationActivitiesQuery = operations['get_conversation_activity_index']['parameters']['query'];

export const conversationService = {
    async createConversation(
        req?: ApiRequest<'post_conversation_create'>,
    ): Promise<ApiResponse<'post_conversation_create'>> {
        const res = await api.POST('/api/conversation-users/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_conversation_create'>;
    },
    async getConversations(req?: ApiRequest<'get_conversation_index'>): Promise<ApiResponse<'get_conversation_index'>> {
        const res = await api.GET('/api/conversations', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_conversation_index'>;
    },
    async getConversation(
        req?: ApiRequest<'get_conversation_details'>,
    ): Promise<ApiResponse<'get_conversation_details'>> {
        const res = await api.GET('/api/conversations/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_conversation_details'>;
    },
    async updateConversation(
        req?: ApiRequest<'put_conversation_update'>,
    ): Promise<ApiResponse<'put_conversation_update'>> {
        const res = await api.PUT('/api/conversations/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_conversation_update'>;
    },
    async deleteConversation(
        req?: ApiRequest<'delete_conversation_delete'>,
    ): Promise<ApiResponse<'delete_conversation_delete'>> {
        const res = await api.DELETE('/api/conversations/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_conversation_delete'>;
    },
    async updateConversationStatus(
        req?: ApiRequest<'patch_conversation_update_status'>,
    ): Promise<ApiResponse<'patch_conversation_update_status'>> {
        const res = await api.PATCH('/api/conversations/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_conversation_update_status'>;
    },
    async updateConversationActivityUpdatedAt(
        req?: ApiRequest<'patch_conversation_activity_update_updated_at'>,
    ): Promise<ApiResponse<'patch_conversation_activity_update_updated_at'>> {
        const res = await api.PATCH('/api/conversation-activity-users/{id}/updated-at', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_conversation_activity_update_updated_at'>;
    },
    async getConversationActivities(
        req?: ApiRequest<'get_conversation_activity_index'>,
    ): Promise<ApiResponse<'get_conversation_activity_index'>> {
        const res = await api.GET('/api/conversation-activities', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_conversation_activity_index'>;
    },
    async getConversationActivity(
        req?: ApiRequest<'get_conversation_activity_details'>,
    ): Promise<ApiResponse<'get_conversation_activity_details'>> {
        const res = await api.GET('/api/conversation-activity-users/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_conversation_activity_details'>;
    },
};
