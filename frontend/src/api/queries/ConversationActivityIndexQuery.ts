import {ConversationActivityFilterQuery} from './ConversationActivityFilterQuery';

export class ConversationActivityIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: ConversationActivityFilterQuery | null = null;
}