import {apiFetch} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {TrainingResponse} from '../responses/TrainingResponse';
import {TrainingBody} from '../body/TrainingBody';
import {StatusBody} from '../body/StatusBody';

export class TrainingProvider {
    async create(dto: TrainingBody): Promise<IdResponse> {
        return await apiFetch('/api/trainings', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: TrainingBody): Promise<IdResponse> {
        return await apiFetch(`/api/trainings/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/trainings/${id}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/trainings/${id}`, {method: 'DELETE'});
    }

    async index(page: number, limit: number, sort: string, filter: any = {}): Promise<TrainingResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/trainings?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string, include: string[] = []): Promise<TrainingResponse> {
        const query = buildQueryString(include);
        return await apiFetch(`/api/trainings/${id}${query}`, {method: 'GET'});
    }

    async updateParticipantStatus(participantId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/training-participants/${participantId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }
}