import {apiFetch} from '../../utils/api';
import {SignBody} from '../body/SignBody';
import {CodeBody} from '../body/CodeBody';
import {IdResponse} from '../responses/IdResponse';
import {TokenResponse} from '../responses/TokenResponse';

export class SignProvider {
    async sign(dto: SignBody): Promise<IdResponse> {
        return await apiFetch('/api/signs', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async confirm(id: string, dto: CodeBody): Promise<TokenResponse> {
        return await apiFetch(`/api/signs/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async resend(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/signs/${id}/resend`, {method: 'POST'});
    }

    async refresh(id: string): Promise<TokenResponse> {
        return await apiFetch(`/api/signs/${id}/refresh`, {method: 'POST'});
    }
}