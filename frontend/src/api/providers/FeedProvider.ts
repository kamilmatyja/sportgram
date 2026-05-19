import {apiFetch} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {FeedResponse} from '../responses/FeedResponse';
import {IdResponse} from '../responses/IdResponse';

export class FeedProvider {
    async create(dto: any): Promise<IdResponse> {
        return await apiFetch('/api/feeds', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: any): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${id}/status`, {method: 'PATCH', body: JSON.stringify({status})});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${id}`, {method: 'DELETE'});
    }

    async index(page: number, limit: number, userId?: string): Promise<FeedResponse[]> {
        const filter = userId ? {userId, status: 2} : {status: 2};
        const params = buildIndexParams(page, limit, 'createdAt:desc', filter);
        return await apiFetch(`/api/feeds?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string, include: string[] = []): Promise<FeedResponse> {
        const query = buildQueryString(include);
        return await apiFetch(`/api/feeds/${id}${query}`, {method: 'GET'});
    }

    async createComment(feedId: string, dto: any): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${feedId}/comments`, {method: 'POST', body: JSON.stringify(dto)});
    }

    async updateComment(commentId: string, dto: any): Promise<IdResponse> {
        return await apiFetch(`/api/feed-comments/${commentId}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateCommentStatus(commentId: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/feed-comments/${commentId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({status})
        });
    }

    async deleteComment(commentId: string): Promise<IdResponse> {
        return await apiFetch(`/api/feed-comments/${commentId}`, {method: 'DELETE'});
    }

    async createReaction(feedId: string, type: number): Promise<IdResponse> {
        return await apiFetch(`/api/feeds/${feedId}/reactions`, {method: 'POST', body: JSON.stringify({type})});
    }

    async updateReaction(reactionId: string, type: number): Promise<IdResponse> {
        return await apiFetch(`/api/feed-reactions/${reactionId}`, {method: 'PUT', body: JSON.stringify({type})});
    }

    async updateReactionStatus(reactionId: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/feed-reactions/${reactionId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({status})
        });
    }

    async deleteReaction(reactionId: string): Promise<IdResponse> {
        return await apiFetch(`/api/feed-reactions/${reactionId}`, {method: 'DELETE'});
    }
}