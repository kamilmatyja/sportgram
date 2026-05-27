import {apiFetch} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {PageResponse} from '../responses/PageResponse';
import {PageFollowResponse} from '../responses/PageFollowResponse';
import {PageBody} from '../body/PageBody';
import {StatusBody} from '../body/StatusBody';
import {PageIndexQuery} from '../queries/PageIndexQuery';
import {PageFollowIndexQuery} from '../queries/PageFollowIndexQuery';

export class PageProvider {
    async create(dto: PageBody): Promise<IdResponse> {
        return await apiFetch('/api/pages', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: PageBody): Promise<IdResponse> {
        return await apiFetch(`/api/pages/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/pages/${id}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/pages/${id}`, {method: 'DELETE'});
    }

    async index(dto: PageIndexQuery): Promise<PageResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/pages?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string, include: string[] = []): Promise<PageResponse> {
        const query = buildQueryString(include);
        return await apiFetch(`/api/pages/${id}${query}`, {method: 'GET'});
    }

    async updateParticipantStatus(participantId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/page-participants/${participantId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async createFollow(pageId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/pages/${pageId}/follows`, {method: 'POST', body: JSON.stringify(dto)});
    }

    async updateFollowStatus(followId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/page-follows/${followId}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async deleteFollow(followId: string): Promise<IdResponse> {
        return await apiFetch(`/api/page-follows/${followId}`, {method: 'DELETE'});
    }

    async indexFollows(dto: PageFollowIndexQuery): Promise<PageFollowResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/page-follows?${params.toString()}`, {method: 'GET'});
    }

    async detailsFollow(followId: string): Promise<PageFollowResponse> {
        return await apiFetch(`/api/page-follows/${followId}`, {method: 'GET'});
    }
}