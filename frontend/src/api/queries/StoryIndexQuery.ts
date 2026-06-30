import { StoryFilterQuery } from './StoryFilterQuery';

export class StoryIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: StoryFilterQuery | null = null;
}
