import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {ConversationResponse} from '../responses/ConversationResponse';
import {ConversationActivityResponse} from '../responses/ConversationActivityResponse';

export class ConversationProvider {
    async create(userId: string, dto: any): Promise<IdResponse> {
        return await apiFetch(`/api/conversation-users/${userId}`, {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: any): Promise<IdResponse> {
        return await apiFetch(`/api/conversations/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/conversations/${id}/status`, {method: 'PATCH', body: JSON.stringify({status})});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/conversations/${id}`, {method: 'DELETE'});
    }

    async index(page: number, limit: number, sort: string, filter: any = {}): Promise<ConversationResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/conversations?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string): Promise<ConversationResponse> {
        return await apiFetch(`/api/conversations/${id}`, {method: 'GET'});
    }

    async updateActivityUpdatedAt(userId: string): Promise<IdResponse> {
        return await apiFetch(`/api/conversation-activitiy-users/${userId}/updated-at`, {method: 'PATCH'});
    }

    async indexActivity(page: number, limit: number, sort: string, filter: any = {}): Promise<ConversationActivityResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/conversation-activities?${params.toString()}`, {method: 'GET'});
    }

    async detailsActivity(id: string): Promise<ConversationActivityResponse> {
        return await apiFetch(`/api/conversation-activity-users/${id}`, {method: 'GET'});
    }
}