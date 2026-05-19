import {apiFetch} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {FeedResponse} from '../responses/FeedResponse';
import {IdResponse} from '../responses/IdResponse';
import {FeedBody} from '../body/FeedBody';
import {FeedCommentBody} from '../body/FeedCommentBody';
import {FeedReactionBody} from '../body/FeedReactionBody';
import {StatusBody} from '../body/StatusBody';
import {FeedIndexQuery} from "../queries/FeedIndexQuery.ts";

export class FeedProvider {
    async create(dto: FeedBody): Promise<IdResponse> {
        return await apiFetch('/api/feeds', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: FeedBody): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${id}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${id}`, {method: 'DELETE'});
    }

    async index(dto: FeedIndexQuery): Promise<FeedResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/feeds?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string, include: string[] = []): Promise<FeedResponse> {
        const query = buildQueryString(include);
        return await apiFetch(`/api/feeds/${id}${query}`, {method: 'GET'});
    }

    async createComment(feedId: string, dto: FeedCommentBody): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${feedId}/comments`, {method: 'POST', body: JSON.stringify(dto)});
    }

    async updateComment(commentId: string, dto: FeedCommentBody): Promise<IdResponse> {
        return await apiFetch(`/api/feed-comments/${commentId}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateCommentStatus(commentId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/feed-comments/${commentId}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async deleteComment(commentId: string): Promise<IdResponse> {
        return await apiFetch(`/api/feed-comments/${commentId}`, {method: 'DELETE'});
    }

    async createReaction(feedId: string, dto: FeedReactionBody): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${feedId}/reactions`, {method: 'POST', body: JSON.stringify(dto)});
    }

    async updateReaction(reactionId: string, dto: FeedReactionBody): Promise<IdResponse> {
        return await apiFetch(`/api/feed-reactions/${reactionId}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateReactionStatus(reactionId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/feed-reactions/${reactionId}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async deleteReaction(reactionId: string): Promise<IdResponse> {
        return await apiFetch(`/api/feed-reactions/${reactionId}`, {method: 'DELETE'});
    }
}