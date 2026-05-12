import { apiFetch } from '../utils/api';

export class RegisterService {
    async register(dto) {
        return await apiFetch('/api/user-nano', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async confirm(id, dto) {
        return await apiFetch(`/api/registers/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async resend(id) {
        return await apiFetch(`/api/registers/${id}/resend`, { method: 'POST' });
    }
}