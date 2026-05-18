import {apiFetch} from '../../utils/api';
import {EmailDto} from '../dto/EmailDto';
import {CodeDto} from '../dto/CodeDto';
import {IdResponse} from '../response/IdResponse';

export class RegisterService {
    async register(dto: EmailDto): Promise<IdResponse> {
        return await apiFetch('/api/registers', {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    }

    async confirm(id: string, dto: CodeDto): Promise<IdResponse> {
        return await apiFetch(`/api/registers/${id}/confirm`, {
            method: 'PATCH',
            body: JSON.stringify(dto)
        });
    }

    async resend(id: string): Promise<IdResponse> {
        return await apiFetch(`/api/registers/${id}/resend`, {method: 'POST'});
    }
}