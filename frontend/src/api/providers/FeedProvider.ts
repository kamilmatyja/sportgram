import {apiFetch} from '../../utils/api';
import {FeedResponse} from '../responses/FeedResponse';
import {buildIndexParams} from '../../utils/buildQueryString';

export class FeedProvider {
    async index(page: number, limit: number, userId: string): Promise<FeedResponse[]> {
        const params = buildIndexParams(page, limit, 'createdAt:desc', {userId, status: 2});

        return await apiFetch(`/api/feeds?${params.toString()}`, {method: 'GET'});
    }
}