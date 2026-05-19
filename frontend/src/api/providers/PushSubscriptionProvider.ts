import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {PushSubscriptionResponse} from '../responses/PushSubscriptionResponse';

export class PushSubscriptionProvider {
    async create(dto: any): Promise<IdResponse> {
        return await apiFetch('/api/push-subscriptions', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: any): Promise<IdResponse> {
        return await apiFetch(`/api/push-subscriptions/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/push-subscriptions/${id}`, {method: 'DELETE'});
    }

    async index(page: number, limit: number, sort: string, filter: any = {}): Promise<PushSubscriptionResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/push-subscriptions?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string): Promise<PushSubscriptionResponse> {
        return await apiFetch(`/api/push-subscriptions/${id}`, {method: 'GET'});
    }
}