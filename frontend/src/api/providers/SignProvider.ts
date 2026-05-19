import {apiFetch} from '../../utils/api';
import {SignDto} from '../dto/SignDto';
import {CodeDto} from '../dto/CodeDto';
import {IdResponse} from '../responses/IdResponse';
import {TokenResponse} from '../responses/TokenResponse';

export class SignProvider {
    async sign(dto: SignDto): Promise<IdResponse> {
        return await apiFetch('/api/signs', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async confirm(id: string, dto: CodeDto): Promise<TokenResponse> {
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