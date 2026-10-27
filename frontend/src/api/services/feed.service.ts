import { api } from '../client';
import type { components, operations } from '../schema';
import type { ElementStatusDto } from './common.types';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';

export type FeedResource = components['schemas']['FeedResource'];
export type FeedDto = components['schemas']['FeedDto'];
export type FeedFilterDto = components['schemas']['FeedFilterDto'];
export type FeedCommentResource = components['schemas']['FeedCommentResource'];
export type FeedCommentDto = components['schemas']['FeedCommentDto'];
export type FeedReactionResource = components['schemas']['FeedReactionResource'];
export type FeedReactionDto = components['schemas']['FeedReactionDto'];

export type GetFeedsQuery = operations['get_feed_index']['parameters']['query'];
export type GetFeedDetailsQuery = operations['get_feed_details']['parameters']['query'];

export type GetFeedsResponse = operations['get_feed_index']['responses'][200]['content']['application/json'];
export type CreateFeedResponse = operations['post_feed_create']['responses'][201]['content']['application/json'];
export type GetFeedResponse = operations['get_feed_details']['responses'][200]['content']['application/json'];
export type UpdateFeedResponse = operations['put_feed_update']['responses'][200]['content']['application/json'];
export type DeleteFeedResponse = operations['delete_feed_delete']['responses'][200]['content']['application/json'];
export type UpdateFeedStatusResponse =
    operations['patch_feed_update_status']['responses'][200]['content']['application/json'];
export type CreateFeedCommentResponse =
    operations['post_feed_comment_create']['responses'][201]['content']['application/json'];
export type UpdateFeedCommentResponse =
    operations['put_feed_comment_update']['responses'][200]['content']['application/json'];
export type DeleteFeedCommentResponse =
    operations['delete_feed_comment_delete']['responses'][200]['content']['application/json'];
export type UpdateFeedCommentStatusResponse =
    operations['patch_feed_comment_update_status']['responses'][200]['content']['application/json'];
export type CreateFeedReactionResponse =
    operations['post_feed_reaction_create']['responses'][201]['content']['application/json'];
export type UpdateFeedReactionResponse =
    operations['put_feed_reaction_update']['responses'][200]['content']['application/json'];
export type DeleteFeedReactionResponse =
    operations['delete_feed_reaction_delete']['responses'][200]['content']['application/json'];
export type UpdateFeedReactionStatusResponse =
    operations['patch_feed_reaction_update_status']['responses'][200]['content']['application/json'];

export const feedService = {
    async getFeeds(query?: GetFeedsQuery): Promise<GetFeedsResponse> {
        const res = await api.GET('/api/feeds', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createFeed(body: FeedDto): Promise<CreateFeedResponse> {
        const res = await api.POST('/api/feeds', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async getFeed(id: string, query?: GetFeedDetailsQuery): Promise<GetFeedResponse> {
        const res = await api.GET('/api/feeds/{id}', {
            params: { path: { id }, query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateFeed(id: string, body: FeedDto): Promise<UpdateFeedResponse> {
        const res = await api.PUT('/api/feeds/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteFeed(id: string): Promise<DeleteFeedResponse> {
        const res = await api.DELETE('/api/feeds/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateFeedStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdateFeedStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/feeds/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createComment(feedId: string, body: FeedCommentDto): Promise<CreateFeedCommentResponse> {
        const res = await api.POST('/api/feeds/{id}/comments', {
            params: { path: { id: feedId } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateComment(id: string, body: FeedCommentDto): Promise<UpdateFeedCommentResponse> {
        const res = await api.PUT('/api/feed-comments/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteComment(id: string): Promise<DeleteFeedCommentResponse> {
        const res = await api.DELETE('/api/feed-comments/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateCommentStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdateFeedCommentStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/feed-comments/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createReaction(
        feedId: string,
        bodyOrType: FeedReactionDto | FeedReactionEnum,
    ): Promise<CreateFeedReactionResponse> {
        const body: FeedReactionDto =
            typeof bodyOrType === 'number' ? { type: bodyOrType as FeedReactionDto['type'] } : bodyOrType;
        const res = await api.POST('/api/feeds/{id}/reactions', {
            params: { path: { id: feedId } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateReaction(
        id: string,
        bodyOrType: FeedReactionDto | FeedReactionEnum,
    ): Promise<UpdateFeedReactionResponse> {
        const body: FeedReactionDto =
            typeof bodyOrType === 'number' ? { type: bodyOrType as FeedReactionDto['type'] } : bodyOrType;
        const res = await api.PUT('/api/feed-reactions/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteReaction(id: string): Promise<DeleteFeedReactionResponse> {
        const res = await api.DELETE('/api/feed-reactions/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateReactionStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdateFeedReactionStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/feed-reactions/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers
    async addComment(feedId: string, textOrBody: string | FeedCommentDto): Promise<CreateFeedCommentResponse> {
        const body: FeedCommentDto = typeof textOrBody === 'string' ? { text: textOrBody } : textOrBody;
        return await feedService.createComment(feedId, body);
    },

    async addReaction(
        feedId: string,
        reactionOrType: FeedReactionEnum | FeedReactionDto['type'] | FeedReactionDto,
    ): Promise<CreateFeedReactionResponse> {
        const body: FeedReactionDto =
            typeof reactionOrType === 'number' ? { type: reactionOrType as FeedReactionDto['type'] } : reactionOrType;
        return await feedService.createReaction(feedId, body);
    },

    async getUserFeeds(userId: string): Promise<FeedResource[]> {
        const res = await api.GET('/api/feeds', {
            params: {
                query: {
                    filter: { userId },
                    limit: 50,
                    sort: 'createdAt:desc',
                },
            },
        });
        if (res.error) throw res.error;
        return res.data?.data ?? [];
    },
};
