import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {NotificationResponse} from '../responses/NotificationResponse';

export class NotificationProvider {
    async index(page: number, limit: number, sort: string, filter: any = {}): Promise<NotificationResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/notifications?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string): Promise<NotificationResponse> {
        return await apiFetch(`/api/notifications/${id}`, {method: 'GET'});
    }

    async updateStatus(id: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/notifications/${id}/status`, {method: 'PATCH', body: JSON.stringify({status})});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/notifications/${id}`, {method: 'DELETE'});
    }
}