import { api } from '../client';
import type { components, operations } from '../schema';
import type { ElementStatusDto } from './common.types';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';

export type StoryResource = components['schemas']['StoryResource'];
export type StoryDto = components['schemas']['StoryDto'];
export type StoryFilterDto = components['schemas']['StoryFilterDto'];

export type GetStoriesQuery = operations['get_story_index']['parameters']['query'];

export type GetStoriesResponse = operations['get_story_index']['responses'][200]['content']['application/json'];
export type CreateStoryResponse = operations['post_story_create']['responses'][201]['content']['application/json'];
export type GetStoryResponse = operations['get_story_details']['responses'][200]['content']['application/json'];
export type UpdateStoryResponse = operations['put_story_update']['responses'][200]['content']['application/json'];
export type DeleteStoryResponse = operations['delete_story_delete']['responses'][200]['content']['application/json'];
export type UpdateStoryStatusResponse =
    operations['patch_story_update_status']['responses'][200]['content']['application/json'];

export const storyService = {
    async getStories(query?: GetStoriesQuery): Promise<GetStoriesResponse> {
        const res = await api.GET('/api/stories', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createStory(body: StoryDto): Promise<CreateStoryResponse> {
        const res = await api.POST('/api/stories', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async getStory(id: string): Promise<GetStoryResponse> {
        const res = await api.GET('/api/stories/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateStory(id: string, body: StoryDto): Promise<UpdateStoryResponse> {
        const res = await api.PUT('/api/stories/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteStory(id: string): Promise<DeleteStoryResponse> {
        const res = await api.DELETE('/api/stories/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateStoryStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdateStoryStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/stories/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
