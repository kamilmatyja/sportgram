import {apiFetch} from '../../utils/api';
import {EmailDto} from '../dto/EmailDto';
import {PasswordResetDto} from '../dto/PasswordResetDto';
import {IdResponse} from '../response/IdResponse';

export class PasswordResetService {
    async passwordReset(dto: EmailDto): Promise<IdResponse> {
        return await apiFetch('/api/password-resets', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async confirm(id: string, dto: PasswordResetDto): Promise<IdResponse> {
        return await apiFetch(`/api/password-resets/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async resend(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/password-resets/${id}/resend`, {
            method: 'POST'
        });
    }
}