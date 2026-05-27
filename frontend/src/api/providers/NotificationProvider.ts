import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {NotificationResponse} from '../responses/NotificationResponse';
import {StatusBody} from '../body/StatusBody';
import {NotificationIndexQuery} from '../queries/NotificationIndexQuery';

export class NotificationProvider {
    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/notifications/${id}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/notifications/${id}`, {method: 'DELETE'});
    }

    async index(dto: NotificationIndexQuery): Promise<NotificationResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/notifications?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string): Promise<NotificationResponse> {
        return await apiFetch(`/api/notifications/${id}`, {method: 'GET'});
    }
}