import { apiFetch } from '../utils/api';

export class PasswordResetService {
    async passwordReset(dto) {
        return await apiFetch('/api/password-resets', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async confirm(id, dto) {
        return await apiFetch(`/api/password-resets/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async resend(id) {
        return await apiFetch(`/api/password-resets/${id}/resend`, {
            method: 'POST'
        });
    }
}