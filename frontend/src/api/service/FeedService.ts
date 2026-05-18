import {apiFetch} from '../../utils/api';
import {FeedResponse} from '../response/FeedResponse';
import {buildIndexParams} from '../../utils/buildQueryString';

export class FeedService {
    async index(userId: string): Promise<FeedResponse[]> {
        const params = buildIndexParams(1, 100, 'createdAt:desc', {userId, status: 2});

        return await apiFetch(`/api/feeds?${params.toString()}`, {method: 'GET'});
    }
}