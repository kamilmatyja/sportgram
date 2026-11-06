import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type EntryResource = components['schemas']['EntryResource'];
export type EntryDto = components['schemas']['EntryDto'];
export type EntryFilterDto = components['schemas']['EntryFilterDto'];
export type EntryCountResource = components['schemas']['EntryCountResource'];
export type EntryCountFilterDto = components['schemas']['EntryCountFilterDto'];

export type GetEntriesQuery = operations['get_entry_index']['parameters']['query'];
export type GetEntryCountsQuery = operations['get_entry_count_index']['parameters']['query'];

export const entryService = {
    async getEntries(req?: ApiRequest<'get_entry_index'>): Promise<ApiResponse<'get_entry_index'>> {
        const res = await api.GET('/api/entries', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_entry_index'>;
    },
    async createEntry(req?: ApiRequest<'post_entry_create'>): Promise<ApiResponse<'post_entry_create'>> {
        const res = await api.POST('/api/entries', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_entry_create'>;
    },
    async getEntry(req?: ApiRequest<'get_entry_details'>): Promise<ApiResponse<'get_entry_details'>> {
        const res = await api.GET('/api/entries/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_entry_details'>;
    },
    async getEntryCounts(req?: ApiRequest<'get_entry_count_index'>): Promise<ApiResponse<'get_entry_count_index'>> {
        const res = await api.GET('/api/entry-counts', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_entry_count_index'>;
    },
};
