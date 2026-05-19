import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {StatisticResponse} from '../responses/StatisticResponse';

export class StatisticProvider {
    async indexRecords(page: number, limit: number, sort: string, filter: any = {}): Promise<StatisticResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/statistics/records?${params.toString()}`, {method: 'GET'});
    }

    async indexProgress(page: number, limit: number, sort: string, filter: any = {}): Promise<StatisticResponse[]> {
        const params = buildIndexParams(page, limit, sort, filter);
        return await apiFetch(`/api/statistics/progress?${params.toString()}`, {method: 'GET'});
    }
}