import { apiFetch } from '../../utils/api';
import { buildIndexParams, buildQueryString } from '../../utils/buildQueryString';
import { RegisterBody } from '../body/RegisterBody';
import { StatusBody } from '../body/StatusBody';
import { UserCreateBody } from '../body/UserCreateBody';
import { UserUpdateBody } from '../body/UserUpdateBody';
import { UserIndexQuery } from '../queries/UserIndexQuery';
import { CollectionResponse } from '../responses/CollectionResponse';
import { IdResponse } from '../responses/IdResponse';
import { ItemResponse } from '../responses/ItemResponse';
import { UserResponse } from '../responses/UserResponse';

export class UserProvider {
    async createNano(dto: RegisterBody): Promise<IdResponse> {
        return await apiFetch('/api/user-nano', { method: 'POST', body: JSON.stringify(dto) });
    }

    async create(dto: UserCreateBody): Promise<IdResponse> {
        return await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(dto) });
    }

    async update(id: string, dto: UserUpdateBody): Promise<IdResponse> {
        return await apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/users/${id}/status`, { method: 'PATCH', body: JSON.stringify(dto) });
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    }

    async index(dto: UserIndexQuery): Promise<CollectionResponse<UserResponse>> {
        const queryString = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? [], dto.include);
        return await apiFetch(`/api/users?${queryString}`, { method: 'GET' });
    }

    async details(id: string, include: string[] = []): Promise<UserResponse> {
        const queryString = buildQueryString(include);
        return (await apiFetch<ItemResponse<UserResponse>>(`/api/users/${id}${queryString}`, { method: 'GET' })).data;
    }
}
