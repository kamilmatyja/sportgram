import {PushSubscriptionFilterQuery} from './PushSubscriptionFilterQuery';

export class PushSubscriptionIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: PushSubscriptionFilterQuery | null = null;
}