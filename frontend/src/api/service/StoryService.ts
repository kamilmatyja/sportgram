import {apiFetch} from '../../utils/api';
import {StoryResponse} from '../response/StoryResponse';
import {buildIndexParams} from '../../utils/buildQueryString';

export class StoryService {
    async index(userId: string): Promise<StoryResponse[]> {
        const params = buildIndexParams(1, 100, 'createdAt:desc', {userId, status: 2});

        return await apiFetch(`/api/stories?${params.toString()}`, {method: 'GET'});
    }
}