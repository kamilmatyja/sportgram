import {NotificationFilterQuery} from './NotificationFilterQuery';

export class NotificationIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: NotificationFilterQuery | null = null;
}