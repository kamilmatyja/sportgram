import { apiFetch } from '../utils/api';

export class UserService {
    async createNano(dto) {
        return await apiFetch('/api/user-nano', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }
}