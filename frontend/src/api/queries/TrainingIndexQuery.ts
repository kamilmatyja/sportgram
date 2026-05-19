export interface TrainingFilterQuery {
    userId?: string;
    link?: string;
    title?: string;
    status?: number;
}

export interface TrainingIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: TrainingFilterQuery | null;
}