import { api } from '../client';
import type { components } from '../schema';

export type StoryResource = components['schemas']['StoryResource'];
export type StoryDto = components['schemas']['StoryDto'];

export interface GetStoriesParams {
    page?: number;
    limit?: number;
    filter?: {
        userId?: string | null;
    };
    sort?: string;
}

export const storyService = {
    async getStories(params?: GetStoriesParams) {
        const query: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            sort: params?.sort ?? 'createdAt:desc',
        };
        if (params?.filter) query.filter = params.filter;

        const res = await api.GET('/api/stories', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createStory(body: StoryDto) {
        const res = await api.POST('/api/stories', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteStory(id: string) {
        const res = await api.DELETE('/api/stories/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
