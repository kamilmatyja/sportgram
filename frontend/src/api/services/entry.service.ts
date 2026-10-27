import { api } from '../client';
import type { components, operations } from '../schema';

export type EntryResource = components['schemas']['EntryResource'];
export type EntryDto = components['schemas']['EntryDto'];
export type EntryFilterDto = components['schemas']['EntryFilterDto'];
export type EntryCountResource = components['schemas']['EntryCountResource'];
export type EntryCountFilterDto = components['schemas']['EntryCountFilterDto'];

export type GetEntriesQuery = operations['get_entry_index']['parameters']['query'];
export type GetEntryCountsQuery = operations['get_entry_count_index']['parameters']['query'];

export type GetEntriesResponse = operations['get_entry_index']['responses'][200]['content']['application/json'];
export type CreateEntryResponse = operations['post_entry_create']['responses'][201]['content']['application/json'];
export type GetEntryResponse = operations['get_entry_details']['responses'][200]['content']['application/json'];
export type GetEntryCountsResponse =
    operations['get_entry_count_index']['responses'][200]['content']['application/json'];

export const entryService = {
    async getEntries(query?: GetEntriesQuery): Promise<GetEntriesResponse> {
        const res = await api.GET('/api/entries', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createEntry(body: EntryDto): Promise<CreateEntryResponse> {
        const res = await api.POST('/api/entries', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async getEntry(id: string): Promise<GetEntryResponse> {
        const res = await api.GET('/api/entries/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getEntryCounts(query?: GetEntryCountsQuery): Promise<GetEntryCountsResponse> {
        const res = await api.GET('/api/entry-counts', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
