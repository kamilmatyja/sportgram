import { api } from '../client';
import type { components } from '../schema';

export type StatisticResource = components['schemas']['StatisticResource'];

export interface GetStatisticsParams {
    page?: number;
    limit?: number;
    sort?: string;
}

export const statisticService = {
    async getRecords(params?: GetStatisticsParams) {
        const res = await api.GET('/api/statistics/records', {
            params: {
                query: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 10,
                    sort: params?.sort ?? 'time:asc',
                },
            },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getProgress(params?: GetStatisticsParams) {
        const res = await api.GET('/api/statistics/progress', {
            params: {
                query: {
                    page: params?.page ?? 1,
                    limit: params?.limit ?? 10,
                    sort: params?.sort ?? 'createdAt:desc',
                },
            },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
