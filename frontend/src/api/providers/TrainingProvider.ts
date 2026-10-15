import { apiFetch } from '../../utils/api';
import { buildIndexParams, buildQueryString } from '../../utils/buildQueryString';
import { StatusBody } from '../body/StatusBody';
import { TrainingBody } from '../body/TrainingBody';
import { TrainingIndexQuery } from '../queries/TrainingIndexQuery';
import { CollectionResponse } from '../responses/CollectionResponse';
import { IdResponse } from '../responses/IdResponse';
import { ItemResponse } from '../responses/ItemResponse';
import { TrainingResponse } from '../responses/TrainingResponse';

export class TrainingProvider {
    async create(dto: TrainingBody): Promise<IdResponse> {
        return await apiFetch('/api/trainings', { method: 'POST', body: JSON.stringify(dto) });
    }

    async update(id: string, dto: TrainingBody): Promise<IdResponse> {
        return await apiFetch(`/api/trainings/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/trainings/${id}/status`, { method: 'PATCH', body: JSON.stringify(dto) });
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/trainings/${id}`, { method: 'DELETE' });
    }

    async index(dto: TrainingIndexQuery): Promise<CollectionResponse<TrainingResponse>> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? [], dto.include);
        return await apiFetch(`/api/trainings?${params.toString()}`, { method: 'GET' });
    }

    async details(id: string, include: string[] = []): Promise<TrainingResponse> {
        const query = buildQueryString(include);
        return (await apiFetch<ItemResponse<TrainingResponse>>(`/api/trainings/${id}${query}`, { method: 'GET' })).data;
    }

    async updateParticipantStatus(participantId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/training-participants/${participantId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(dto),
        });
    }
}
