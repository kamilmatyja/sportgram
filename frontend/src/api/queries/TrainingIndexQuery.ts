import { TrainingFilterQuery } from './TrainingFilterQuery';

export class TrainingIndexQuery {
    page?: number = 1;
    limit?: number = 10;
    sort?: string = 'createdAt:desc';
    filter?: TrainingFilterQuery | null = null;
    include: string[] = [];
}
