import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {IdResponse} from '../responses/IdResponse';
import {EntryResponse} from '../responses/EntryResponse';
import {EntryCountResponse} from '../responses/EntryCountResponse';

export class EntryProvider {
    async create(dto: any): Promise<IdResponse> {
        return await apiFetch('/api/entries', {method: 'POST', body: JSON.stringify(dto)});
    }

    async index(page: number, limit: number, sort: string, filter: any = {}): Promise<EntryResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/entries?${params.toString()}`, {method: 'GET'});
    }

    async details(id: string): Promise<EntryResponse> {
        return await apiFetch(`/api/entries/${id}`, {method: 'GET'});
    }

    async indexCount(page: number, limit: number, sort: string, filter: any = {}): Promise<EntryCountResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/entry-counts?${params.toString()}`, {method: 'GET'});
    }
}