import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {FriendResponse} from '../response/FriendResponse';
import {IdResponse} from '../response/IdResponse';

export class FriendService {
    async index(userIds: string[]): Promise<FriendResponse[]> {
        const params = buildIndexParams(1, 100, 'createdAt:desc', {userIds});

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