import {apiFetch} from '../../utils/api';
import {EmailBody} from '../body/EmailBody';
import {PasswordResetBody} from '../body/PasswordResetBody';
import {IdResponse} from '../responses/IdResponse';

export class PasswordResetProvider {
    async passwordReset(dto: EmailBody): Promise<IdResponse> {
        return await apiFetch('/api/password-resets', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async confirm(id: string, dto: PasswordResetBody): Promise<IdResponse> {
        return await apiFetch(`/api/password-resets/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async resend(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/password-resets/${id}/resend`, {method: 'POST'});
    }
}