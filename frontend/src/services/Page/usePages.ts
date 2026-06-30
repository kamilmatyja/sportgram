import { useEffect } from 'react';

import { PageProvider } from '../../api/providers/PageProvider';
import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { PageIndexQuery } from '../../api/queries/PageIndexQuery';
import { PageResponse } from '../../api/responses/PageResponse';
import { useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useListFilters } from '../../utils/hooks/useListFilters';

export function usePages() {
    const access = useAppAccess();
    const pageProvider = new PageProvider();
    const list = useListFilters(new PageFilterQuery());
    const { data, loading, error, executeFetch } = useDataFetch<PageResponse[]>();

    const fetchPages = () => {
        executeFetch(async () => {
            const filterDto = new PageFilterQuery();
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new PageIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            return await pageProvider.index(indexDto);
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchPages();
        }
    }, [access.authLoading, access.authError, list.page, list.limit, list.sort, list.filters]);

    return {
        ...access,
        ...list,
        pages: data || [],
        loading: access.authLoading || loading,
        error: access.authError || error,
        fetchPages,
    };
}
