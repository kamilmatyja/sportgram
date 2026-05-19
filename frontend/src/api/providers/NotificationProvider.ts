import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {NotificationResponse} from '../responses/NotificationResponse';
import {StatusBody} from '../body/StatusBody';

export class NotificationProvider {
    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/notifications/${id}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/notifications/${id}`, {method: 'DELETE'});
    }

    async index(page: number, limit: number, sort: string, filter: any = {}): Promise<NotificationResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/notifications?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string): Promise<NotificationResponse> {
        return await apiFetch(`/api/notifications/${id}`, {method: 'GET'});
    }
}