import { apiFetch } from '../../utils/api';
import { buildIndexParams } from '../../utils/buildQueryString';
import { EntryBody } from '../body/EntryBody';
import { EntryCountIndexQuery } from '../queries/EntryCountIndexQuery';
import { EntryIndexQuery } from '../queries/EntryIndexQuery';
import { EntryCountResponse } from '../responses/EntryCountResponse';
import { EntryResponse } from '../responses/EntryResponse';
import { IdResponse } from '../responses/IdResponse';

export class EntryProvider {
    async create(dto: EntryBody): Promise<IdResponse> {
        return await apiFetch('/api/entries', { method: 'POST', body: JSON.stringify(dto) });
    }

    async index(dto: EntryIndexQuery): Promise<EntryResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/entries?${params.toString()}`, { method: 'GET' });
    }

    async details(id: string): Promise<EntryResponse> {
        return await apiFetch(`/api/entries/${id}`, { method: 'GET' });
    }

    async indexCount(dto: EntryCountIndexQuery): Promise<EntryCountResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/entry-counts?${params.toString()}`, { method: 'GET' });
    }
}
