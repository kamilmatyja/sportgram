import {apiFetch} from '../utils/api';

export class SignService {
    async sign(dto) {
        return await apiFetch('/api/signs', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async confirm(id, dto) {
        return await apiFetch(`/api/signs/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async resend(id) {
        return await apiFetch(`/api/signs/${id}/resend`, {
            method: 'POST'
        });
    }

    async refresh(id) {

        return await apiFetch(`/api/signs/${id}/refresh`, {
            method: 'POST'
        });
    }
}