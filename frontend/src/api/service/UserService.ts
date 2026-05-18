import {apiFetch} from '../../utils/api';
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
        const params = new URLSearchParams();
        if (dto.page) params.append('page', dto.page.toString());
        if (dto.limit) params.append('limit', dto.limit.toString());
        if (dto.sort) params.append('sort', dto.sort);

        if (dto.filter) {
            Object.entries(dto.filter).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(`filter[${key}][]`, String(v)));
                    } else {
                        params.append(`filter[${key}]`, String(value));
                    }
                }
            });
        }

        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/users?${params.toString()}`, {
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
        const params = new URLSearchParams();
        include.forEach(inc => params.append('include[]', inc));
        const queryString = params.toString() ? `?${params.toString()}` : '';

        return await apiFetch(`/api/users/${id}${queryString}`, {
            method: 'GET'
        });
    }
}