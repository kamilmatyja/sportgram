import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {FriendResponse} from '../responses/FriendResponse';
import {IdResponse} from '../responses/IdResponse';
import {FriendBody} from '../body/FriendBody';
import {StatusBody} from '../body/StatusBody';

export class FriendProvider {
    async create(dto: FriendBody): Promise<IdResponse> {
        return await apiFetch('/api/friends', {method: 'POST', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/friends/${id}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/friends/${id}`, {method: 'DELETE'});
    }

    async index(page: number, limit: number, userIds: string[]): Promise<FriendResponse[]> {
        const params = buildIndexParams(page, limit, 'createdAt:desc', {userIds});

        return await apiFetch(`/api/friends?${params.toString()}`, {method: 'GET'});
    }
}