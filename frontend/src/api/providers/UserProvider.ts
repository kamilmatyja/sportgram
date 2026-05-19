import {apiFetch} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {RegisterDto} from '../dto/RegisterDto';
import {UserIndexDto} from '../dto/UserIndexDto';
import {IdResponse} from '../responses/IdResponse';
import {UserResponse} from '../responses/UserResponse';
import {UserCreateDto} from "../dto/UserCreateDto.ts";

export class UserProvider {
    async createNano(dto: RegisterDto): Promise<IdResponse> {
        return await apiFetch('/api/user-nano', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async create(dto: UserCreateDto): Promise<IdResponse> {
        return await apiFetch('/api/users', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async index(dto: UserIndexDto): Promise<UserResponse[]> {
        const queryString = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);

        const data = await apiFetch(`/api/users?${queryString}`, {method: 'GET'});

        return data as UserResponse[];
    }

    async details(id: string, include: string[] = []): Promise<UserResponse> {
        const queryString = buildQueryString(include);

        return await apiFetch(`/api/users/${id}${queryString}`, {method: 'GET'});
    }

    async updateStatus(id: string, status: number): Promise<IdResponse> {
        return await apiFetch(`/api/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({status})
        });
    }
}