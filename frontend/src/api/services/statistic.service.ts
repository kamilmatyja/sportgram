import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type StatisticResource = components['schemas']['StatisticResource'];

export type GetStatisticRecordsQuery = operations['get_statistic_record_index']['parameters']['query'];
export type GetStatisticProgressQuery = operations['get_statistic_progres_index']['parameters']['query'];

export const statisticService = {
    async getStatisticRecords(
        req: ApiRequest<'get_statistic_record_index'>,
    ): Promise<ApiResponse<'get_statistic_record_index'>> {
        const res = await api.GET('/api/statistics/records', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getStatisticProgress(
        req: ApiRequest<'get_statistic_progres_index'>,
    ): Promise<ApiResponse<'get_statistic_progres_index'>> {
        const res = await api.GET('/api/statistics/progress', req);
        if (res.error) throw res.error;
        return res.data;
    },
};
