import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {PushSubscriptionResponse} from '../responses/PushSubscriptionResponse';
import {PushSubscriptionBody} from '../body/PushSubscriptionBody';
import {PushSubscriptionIndexQuery} from "../queries/PushSubscriptionIndexQuery.ts";

export class PushSubscriptionProvider {
    async create(dto: PushSubscriptionBody): Promise<IdResponse> {
        return await apiFetch('/api/push-subscriptions', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: PushSubscriptionBody): Promise<IdResponse> {
        return await apiFetch(`/api/push-subscriptions/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/push-subscriptions/${id}`, {method: 'DELETE'});
    }

    async index(dto: PushSubscriptionIndexQuery): Promise<PushSubscriptionResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/push-subscriptions?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string): Promise<PushSubscriptionResponse> {
        return await apiFetch(`/api/push-subscriptions/${id}`, {method: 'GET'});
    }
}