import {apiFetch} from '../../utils/api';
import {buildIndexParams} from '../../utils/buildQueryString';
import {StatisticResponse} from '../responses/StatisticResponse';
import {StatisticIndexQuery} from '../queries/StatisticIndexQuery';

export class StatisticProvider {
    async indexRecords(dto: StatisticIndexQuery): Promise<StatisticResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/statistics/records?${params.toString()}`, {method: 'GET'});
    }

    async indexProgress(dto: StatisticIndexQuery): Promise<StatisticResponse[]> {
        const params = buildIndexParams(dto.page, dto.limit, dto.sort, dto.filter ?? []);
        return await apiFetch(`/api/statistics/progress?${params.toString()}`, {method: 'GET'});
    }
}