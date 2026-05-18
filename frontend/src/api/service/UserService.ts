import {apiFetch, buildAuthHeaders} from '../../utils/api';
import {buildIndexParams, buildQueryString} from '../../utils/buildQueryString';
import {RegisterDto} from '../dto/RegisterDto';
import {UserIndexDto} from '../dto/UserIndexDto';
import {IdResponse} from '../response/IdResponse';
import {UserResponse} from '../response/UserResponse';
import {UserCreateDto} from "../dto/UserCreateDto.ts";

export class UserService {
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
        const queryString = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? undefined);
        const headers = buildAuthHeaders();

        const response = await fetch(`/api/users?${queryString}`, {
            method: 'GET',
            headers
        });

        const data = await response.json();
        if (!response.ok) {
            throw data;
        }

        return data as UserResponse[];
    }

    async details(id: string, include: string[] = []): Promise<UserResponse> {
        const queryString = buildQueryString(include);

        return await apiFetch(`/api/users/${id}${queryString}`, {
            method: 'GET'
        });
    }
}