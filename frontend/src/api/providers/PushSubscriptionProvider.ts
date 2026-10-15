import { apiFetch } from '../../utils/api';
import { buildIndexParams } from '../../utils/buildQueryString';
import { PushSubscriptionBody } from '../body/PushSubscriptionBody';
import { PushSubscriptionIndexQuery } from '../queries/PushSubscriptionIndexQuery';
import { CollectionResponse } from '../responses/CollectionResponse';
import { IdResponse } from '../responses/IdResponse';
import { ItemResponse } from '../responses/ItemResponse';
import { PushSubscriptionResponse } from '../responses/PushSubscriptionResponse';

export class PushSubscriptionProvider {
    async create(dto: PushSubscriptionBody): Promise<IdResponse> {
        return await apiFetch('/api/push-subscriptions', { method: 'POST', body: JSON.stringify(dto) });
    }

    async update(id: string, dto: PushSubscriptionBody): Promise<IdResponse> {
        return await apiFetch(`/api/push-subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/push-subscriptions/${id}`, { method: 'DELETE' });
    }

    async index(dto: PushSubscriptionIndexQuery): Promise<CollectionResponse<PushSubscriptionResponse>> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/push-subscriptions?${params.toString()}`, { method: 'GET' });
    }

    async details(id: string): Promise<PushSubscriptionResponse> {
        return (
            await apiFetch<ItemResponse<PushSubscriptionResponse>>(`/api/push-subscriptions/${id}`, { method: 'GET' })
        ).data;
    }
}
