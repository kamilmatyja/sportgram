import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {FriendResponse} from '../responses/FriendResponse';
import {IdResponse} from '../responses/IdResponse';
import {FriendBody} from '../body/FriendBody';
import {StatusBody} from '../body/StatusBody';
import {FriendIndexQuery} from "../queries/FriendIndexQuery.ts";

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

    async index(dto: FriendIndexQuery): Promise<FriendResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/friends?${params.toString()}`, {method: 'GET'});
    }
}