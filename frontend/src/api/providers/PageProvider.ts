import {apiFetch} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {PageResponse} from '../responses/PageResponse';
import {PageFollowResponse} from '../responses/PageFollowResponse';

export class PageProvider {
    async create(dto: any): Promise<IdResponse> {
        return await apiFetch('/api/pages', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: any): Promise<IdResponse> {
        return await apiFetch(`/api/pages/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/pages/${id}/status`, {method: 'PATCH', body: JSON.stringify({status})});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/pages/${id}`, {method: 'DELETE'});
    }

    async index(page: number, limit: number, sort: string, filter: any = {}): Promise<PageResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/pages?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string, include: string[] = []): Promise<PageResponse> {
        const query = buildQueryString(include);
        return await apiFetch(`/api/pages/${id}${query}`, {method: 'GET'});
    }

    async updateParticipantStatus(participantId: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/page-participants/${participantId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({status})
        });
    }

    async createFollow(pageId: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/pages/${pageId}/follows`, {method: 'POST', body: JSON.stringify({status})});
    }

    async updateFollowStatus(followId: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/page-follows/${followId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({status})
        });
    }

    async deleteFollow(followId: string): Promise<IdResponse> {
        return await apiFetch(`/api/page-follows/${followId}`, {method: 'DELETE'});
    }

    async indexFollows(page: number, limit: number, sort: string, filter: any = {}): Promise<PageFollowResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/page-follows?${params.toString()}`, {method: 'GET'});
    }

    async detailsFollow(followId: string): Promise<PageFollowResponse> {
        return await apiFetch(`/api/page-follows/${followId}`, {method: 'GET'});
    }
}