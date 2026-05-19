import {apiFetch} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {GoalResponse} from '../responses/GoalResponse';
import {GoalBody} from '../body/GoalBody';
import {StatusBody} from '../body/StatusBody';
import {GoalIndexQuery} from "../queries/GoalIndexQuery.ts";

export class GoalProvider {
    async create(dto: GoalBody): Promise<IdResponse> {
        return await apiFetch('/api/goals', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: GoalBody): Promise<IdResponse> {
        return await apiFetch(`/api/goals/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/goals/${id}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/goals/${id}`, {method: 'DELETE'});
    }

    async index(dto: GoalIndexQuery): Promise<GoalResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/goals?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string, include: string[] = []): Promise<GoalResponse> {
        const query = buildQueryString(include);
        return await apiFetch(`/api/goals/${id}${query}`, {method: 'GET'});
    }

    async updateParticipantStatus(participantId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/goal-participants/${participantId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async updateParticipantResultStatus(resultId: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/goal-participant-results/${resultId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }
}