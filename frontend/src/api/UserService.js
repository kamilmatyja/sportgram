import { apiFetch } from '../utils/api';

export class UserService {
    async createNano(dto) {
        return await apiFetch('/api/user-nano', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async index(dto) {
        const params = new URLSearchParams();
        if (dto.page) params.append('page', dto.page);
        if (dto.limit) params.append('limit', dto.limit);
        if (dto.sort) params.append('sort', dto.sort);

        if (dto.filter) {
            Object.entries(dto.filter).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(`filter[${key}][]`, v));
                    } else {
                        params.append(`filter[${key}]`, value);
                    }
                }
            });
        }

        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch(`/api/users?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw data;
        }

        return data;
    }
}