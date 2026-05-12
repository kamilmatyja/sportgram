import { apiFetch } from '../utils/api';

export class SignService {
    async sign(signDto) {
        return await apiFetch('/api/signs', {
            method: 'POST',
            body: JSON.stringify(signDto)
        });
    }

    async confirm(id, codeDto) {
        return await apiFetch(`/api/signs/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify(codeDto)
        });
    }

    async resend(id) {
        return await apiFetch(`/api/signs/${id}/resend`, {
            method: 'POST'
        });
    }
}