import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type StoryResource = components['schemas']['StoryResource'];
export type StoryDto = components['schemas']['StoryDto'];
export type StoryFilterDto = components['schemas']['StoryFilterDto'];

export type GetStoriesQuery = operations['get_story_index']['parameters']['query'];
export type GetStoryDetailsQuery = operations['get_story_details']['parameters']['query'];

export const storyService = {
    async getStories(req?: ApiRequest<'get_story_index'>): Promise<ApiResponse<'get_story_index'>> {
        const res = await api.GET('/api/stories', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_story_index'>;
    },
    async createStory(req?: ApiRequest<'post_story_create'>): Promise<ApiResponse<'post_story_create'>> {
        const res = await api.POST('/api/stories', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_story_create'>;
    },
    async getStory(req?: ApiRequest<'get_story_details'>): Promise<ApiResponse<'get_story_details'>> {
        const res = await api.GET('/api/stories/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_story_details'>;
    },
    async updateStory(req?: ApiRequest<'put_story_update'>): Promise<ApiResponse<'put_story_update'>> {
        const res = await api.PUT('/api/stories/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_story_update'>;
    },
    async deleteStory(req?: ApiRequest<'delete_story_delete'>): Promise<ApiResponse<'delete_story_delete'>> {
        const res = await api.DELETE('/api/stories/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_story_delete'>;
    },
    async updateStoryStatus(
        req?: ApiRequest<'patch_story_update_status'>,
    ): Promise<ApiResponse<'patch_story_update_status'>> {
        const res = await api.PATCH('/api/stories/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_story_update_status'>;
    },
};
