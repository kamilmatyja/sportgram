export interface StatisticFilterQuery {
    userIds?: string[];
    discipline?: number;
    distance?: number;
}

export interface StatisticIndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: StatisticFilterQuery | null;
}