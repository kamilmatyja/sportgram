import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {StoryResponse} from '../responses/StoryResponse';
import {IdResponse} from '../responses/IdResponse';

export class StoryProvider {
    async create(dto: any): Promise<IdResponse> {
        return await apiFetch('/api/stories', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: any): Promise<IdResponse> {
        return await apiFetch(`/api/stories/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/stories/${id}/status`, {method: 'PATCH', body: JSON.stringify({status})});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/stories/${id}`, {method: 'DELETE'});
    }

    async index(page: number, limit: number, sort: string = 'createdAt:desc', filter: any = {}): Promise<StoryResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/stories?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string): Promise<StoryResponse> {
        return await apiFetch(`/api/stories/${id}`, {method: 'GET'});
    }
}