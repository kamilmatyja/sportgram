import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type FeedResource = components['schemas']['FeedResource'];
export type FeedDto = components['schemas']['FeedDto'];
export type FeedFilterDto = components['schemas']['FeedFilterDto'];
export type FeedCommentResource = components['schemas']['FeedCommentResource'];
export type FeedCommentDto = components['schemas']['FeedCommentDto'];
export type FeedReactionResource = components['schemas']['FeedReactionResource'];
export type FeedReactionDto = components['schemas']['FeedReactionDto'];
export type ElementStatusDto = components['schemas']['ElementStatusDto'];

export type GetFeedsQuery = operations['get_feed_index']['parameters']['query'];
export type GetFeedDetailsQuery = operations['get_feed_details']['parameters']['query'];
export type GetFeedCommentsQuery = operations['get_feed_comment_index']['parameters']['query'];
export type GetFeedReactionsQuery = operations['get_feed_reaction_index']['parameters']['query'];

export const feedService = {
    async getFeeds(req?: ApiRequest<'get_feed_index'>): Promise<ApiResponse<'get_feed_index'>> {
        const res = await api.GET('/api/feeds', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_feed_index'>;
    },
    async createFeed(req?: ApiRequest<'post_feed_create'>): Promise<ApiResponse<'post_feed_create'>> {
        const res = await api.POST('/api/feeds', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_feed_create'>;
    },
    async getFeed(req?: ApiRequest<'get_feed_details'>): Promise<ApiResponse<'get_feed_details'>> {
        const res = await api.GET('/api/feeds/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_feed_details'>;
    },
    async updateFeed(req?: ApiRequest<'put_feed_update'>): Promise<ApiResponse<'put_feed_update'>> {
        const res = await api.PUT('/api/feeds/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_feed_update'>;
    },
    async deleteFeed(req?: ApiRequest<'delete_feed_delete'>): Promise<ApiResponse<'delete_feed_delete'>> {
        const res = await api.DELETE('/api/feeds/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_feed_delete'>;
    },
    async updateFeedStatus(
        req?: ApiRequest<'patch_feed_update_status'>,
    ): Promise<ApiResponse<'patch_feed_update_status'>> {
        const res = await api.PATCH('/api/feeds/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_feed_update_status'>;
    },
    async createFeedComment(
        req?: ApiRequest<'post_feed_comment_create'>,
    ): Promise<ApiResponse<'post_feed_comment_create'>> {
        const res = await api.POST('/api/feeds/{id}/comments', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_feed_comment_create'>;
    },
    async updateFeedComment(
        req?: ApiRequest<'put_feed_comment_update'>,
    ): Promise<ApiResponse<'put_feed_comment_update'>> {
        const res = await api.PUT('/api/feed-comments/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_feed_comment_update'>;
    },
    async deleteFeedComment(
        req?: ApiRequest<'delete_feed_comment_delete'>,
    ): Promise<ApiResponse<'delete_feed_comment_delete'>> {
        const res = await api.DELETE('/api/feed-comments/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_feed_comment_delete'>;
    },
    async updateFeedCommentStatus(
        req?: ApiRequest<'patch_feed_comment_update_status'>,
    ): Promise<ApiResponse<'patch_feed_comment_update_status'>> {
        const res = await api.PATCH('/api/feed-comments/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_feed_comment_update_status'>;
    },
    async getFeedComments(req?: ApiRequest<'get_feed_comment_index'>): Promise<ApiResponse<'get_feed_comment_index'>> {
        const res = await api.GET('/api/feed-comments', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_feed_comment_index'>;
    },
    async createFeedReaction(
        req?: ApiRequest<'post_feed_reaction_create'>,
    ): Promise<ApiResponse<'post_feed_reaction_create'>> {
        const res = await api.POST('/api/feeds/{id}/reactions', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_feed_reaction_create'>;
    },
    async updateFeedReaction(
        req?: ApiRequest<'put_feed_reaction_update'>,
    ): Promise<ApiResponse<'put_feed_reaction_update'>> {
        const res = await api.PUT('/api/feed-reactions/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_feed_reaction_update'>;
    },
    async deleteFeedReaction(
        req?: ApiRequest<'delete_feed_reaction_delete'>,
    ): Promise<ApiResponse<'delete_feed_reaction_delete'>> {
        const res = await api.DELETE('/api/feed-reactions/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_feed_reaction_delete'>;
    },
    async updateFeedReactionStatus(
        req?: ApiRequest<'patch_feed_reaction_update_status'>,
    ): Promise<ApiResponse<'patch_feed_reaction_update_status'>> {
        const res = await api.PATCH('/api/feed-reactions/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_feed_reaction_update_status'>;
    },
    async getFeedReactions(
        req?: ApiRequest<'get_feed_reaction_index'>,
    ): Promise<ApiResponse<'get_feed_reaction_index'>> {
        const res = await api.GET('/api/feed-reactions', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_feed_reaction_index'>;
    },
};
