import {apiFetch} from '../../utils/api';
import {StoryResponse} from '../responses/StoryResponse';
import {buildIndexParams} from '../../utils/buildQueryString';

export class StoryProvider {
    async index(page: number, limit: number, userId: string): Promise<StoryResponse[]> {
        const params = buildIndexParams(page, limit, 'createdAt:desc', {userId, status: 2});

        return await apiFetch(`/api/stories?${params.toString()}`, {method: 'GET'});
    }
}