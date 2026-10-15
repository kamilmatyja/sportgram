import { PageProvider } from '../api/providers/PageProvider';
import { PageFilterQuery } from '../api/queries/PageFilterQuery';
import { PageIndexQuery } from '../api/queries/PageIndexQuery';
import { PageResponse } from '../api/responses/PageResponse';
import { fetchAllPages } from './query';

export async function fetchUserPages(userId: string): Promise<PageResponse[]> {
    const filter = new PageFilterQuery();
    filter.userId = userId;
    const indexDto = new PageIndexQuery();
    indexDto.filter = filter;

    const pageProvider = new PageProvider();
    return fetchAllPages(indexDto, (query) => pageProvider.index(query));
}
