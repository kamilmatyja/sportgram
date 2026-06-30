import { apiFetch } from '../../utils/api';
import { buildIndexParams } from '../../utils/buildQueryString';
import { StatusBody } from '../body/StatusBody';
import { StoryBody } from '../body/StoryBody';
import { StoryIndexQuery } from '../queries/StoryIndexQuery';
import { IdResponse } from '../responses/IdResponse';
import { StoryResponse } from '../responses/StoryResponse';

export class StoryProvider {
    async create(dto: StoryBody): Promise<IdResponse> {
        return await apiFetch('/api/stories', { method: 'POST', body: JSON.stringify(dto) });
    }

    async update(id: string, dto: StoryBody): Promise<IdResponse> {
        return await apiFetch(`/api/stories/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/stories/${id}/status`, { method: 'PATCH', body: JSON.stringify(dto) });
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/stories/${id}`, { method: 'DELETE' });
    }

    async index(dto: StoryIndexQuery): Promise<StoryResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/stories?${params.toString()}`, { method: 'GET' });
    }

    async details(id: string): Promise<StoryResponse> {
        return await apiFetch(`/api/stories/${id}`, { method: 'GET' });
    }
}
