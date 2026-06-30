import { apiFetch } from '../../utils/api';
import { CodeBody } from '../body/CodeBody';
import { EmailBody } from '../body/EmailBody';
import { IdResponse } from '../responses/IdResponse';

export class RegisterProvider {
    async register(dto: EmailBody): Promise<IdResponse> {
        return await apiFetch('/api/registers', {
            method: 'POST',
            body: JSON.stringify(dto),
        });
    }

    async confirm(id: string, dto: CodeBody): Promise<IdResponse> {
        return await apiFetch(`/api/registers/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify(dto),
        });
    }

    async resend(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/registers/${id}/resend`, { method: 'POST' });
    }
}
