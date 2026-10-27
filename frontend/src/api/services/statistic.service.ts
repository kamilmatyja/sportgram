import { api } from '../client';
import type { components, operations } from '../schema';

export type StatisticResource = components['schemas']['StatisticResource'];
export type StatisticFilterDto = components['schemas']['StatisticFilterDto'];

export type GetStatisticRecordsQuery = operations['get_statistic_record_index']['parameters']['query'];
export type GetStatisticProgressQuery = operations['get_statistic_progres_index']['parameters']['query'];

export type GetStatisticRecordsResponse =
    operations['get_statistic_record_index']['responses'][200]['content']['application/json'];
export type GetStatisticProgressResponse =
    operations['get_statistic_progres_index']['responses'][200]['content']['application/json'];

export const statisticService = {
    async getRecords(query?: GetStatisticRecordsQuery): Promise<GetStatisticRecordsResponse> {
        const res = await api.GET('/api/statistics/records', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getProgress(query?: GetStatisticProgressQuery): Promise<GetStatisticProgressResponse> {
        const res = await api.GET('/api/statistics/progress', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
