import { ConversationFilterQuery } from './ConversationFilterQuery';

export class ConversationIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: ConversationFilterQuery | null = null;
}
