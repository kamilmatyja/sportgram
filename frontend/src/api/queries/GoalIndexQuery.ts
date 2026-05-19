export interface GoalFilterQuery {
    userId?: string;
    link?: string;
    text?: string;
    discipline?: number;
    distance?: number;
    time?: number;
    status?: number;
}

export interface GoalIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: GoalFilterQuery | null;
}