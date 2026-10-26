import { api } from '../client';
import type { components } from '../schema';

export type FeedResource = components['schemas']['FeedResource'];
export type FeedDto = components['schemas']['FeedDto'];
export type FeedCommentResource = components['schemas']['FeedCommentResource'];
export type FeedReactionResource = components['schemas']['FeedReactionResource'];

export interface GetFeedsParams {
    page?: number;
    limit?: number;
    filter?: {
        userId?: string | null;
        text?: string | null;
    };
    sort?: string;
}

export const feedService = {
    async getFeeds(params?: GetFeedsParams) {
        const query: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            sort: params?.sort ?? 'createdAt:desc',
        };
        if (params?.filter) query.filter = params.filter;

        const res = await api.GET('/api/feeds', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createFeed(body: FeedDto) {
        const res = await api.POST('/api/feeds', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteFeed(id: string) {
        const res = await api.DELETE('/api/feeds/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async addComment(feedId: string, text: string) {
        const res = await api.POST('/api/feeds/{id}/comments', {
            params: { path: { id: feedId } },
            body: { text },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async addReaction(feedId: string, reaction: number) {
        const res = await api.POST('/api/feeds/{id}/reactions', {
            params: { path: { id: feedId } },
            body: { reaction: reaction as any },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
