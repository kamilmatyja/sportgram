import {apiFetch} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {RegisterBody} from '../body/RegisterBody.ts';
import {UserIndexQuery} from '../queries/UserIndexQuery.ts';
import {IdResponse} from '../responses/IdResponse';
import {UserResponse} from '../responses/UserResponse';
import {UserCreateBody} from "../body/UserCreateBody.ts";
import {UserUpdateBody} from '../body/UserUpdateBody.ts';
import {StatusBody} from '../body/StatusBody.ts';

export class UserProvider {
    async createNano(dto: RegisterBody): Promise<IdResponse> {
        return await apiFetch('/api/user-nano', {method: 'POST', body: JSON.stringify(dto)});
    }

    async create(dto: UserCreateBody): Promise<IdResponse> {
        return await apiFetch('/api/users', {method: 'POST', body: JSON.stringify(dto)});
    }

    async update(id: string, dto: UserUpdateBody): Promise<IdResponse> {
        return await apiFetch(`/api/users/${id}`, {method: 'PUT', body: JSON.stringify(dto)});
    }

    async updateStatus(id: string, dto: StatusBody): Promise<IdResponse> {
        return await apiFetch(`/api/users/${id}/status`, {method: 'PATCH', body: JSON.stringify(dto)});
    }

    async delete(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/users/${id}`, {method: 'DELETE'});
    }

    async index(dto: UserIndexQuery): Promise<UserResponse[]> {
        const queryString = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/users?${queryString}`, {method: 'GET'});
    }

    async details(id: string, include: string[] = []): Promise<UserResponse> {
        const queryString = buildQueryString(include);
        return await apiFetch(`/api/users/${id}${queryString}`, {method: 'GET'});
    }
}