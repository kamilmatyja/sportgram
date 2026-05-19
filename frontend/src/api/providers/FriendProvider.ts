import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {FriendResponse} from '../responses/FriendResponse';
import {IdResponse} from '../responses/IdResponse';

export class FriendProvider {
    async index(page: number, limit: number, userIds: string[]): Promise<FriendResponse[]> {
        const params = buildIndexParams(page, limit, 'createdAt:desc', {userIds});

        return await apiFetch(`/api/friends?${params.toString()}`, {method: 'GET'});
    }

    async create(receiverUserId: string): Promise<IdResponse> {
        return await apiFetch('/api/friends', {
            method: 'POST',
            body: JSON.stringify({receiverUserId})
        });
    }

    async updateStatus(id: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/friends/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({status})
        });
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/friends/${id}`, {method: 'DELETE'});
    }
}