import { CollectionResponse } from '../api/responses/CollectionResponse';
import { PaginationEnum } from '../enums/PaginationEnum';

export function firstOrNotFound<T>(response: CollectionResponse<T>): T {
    if (response.data.length === 0) {
        throw { error: 'noRecords' };
    }
    return response.data[0];
}

export const toOptionalNumber = (value: unknown): number | undefined => (value ? Number(value) : undefined);

interface PagedQuery {
    page?: number;
    limit?: number;
}

export async function fetchAllPages<T, Q extends PagedQuery>(
    query: Q,
    fetchPage: (query: Q) => Promise<CollectionResponse<T>>,
): Promise<T[]> {
    const items: T[] = [];
    query.limit = PaginationEnum.LG;
    for (let page = 1; ; page++) {
        query.page = page;
        const response = await fetchPage(query);
        items.push(...response.data);
        if (
            !response.pagination.hasNextPage ||
            response.data.length === 0 ||
            items.length >= response.pagination.total
        ) {
            return items;
        }
    }
}
