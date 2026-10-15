import { useEffect } from 'react';

import { CollectionResponse } from '../../api/responses/CollectionResponse';
import { useDataFetch } from './useDataFetch';
import { useListFilters } from './useListFilters';

type ListFilters<TFilter> = ReturnType<typeof useListFilters<TFilter>>;

interface PaginatedListOptions<TFilter, TScope, TItem> {
    initialFilter: TFilter;
    scope: TScope | null;
    fetchPage: (list: ListFilters<TFilter>, scope: TScope) => Promise<TItem[]>;
    deps?: unknown[];
}

export function usePaginatedList<TFilter, TScope, TItem>({
    initialFilter,
    scope,
    fetchPage,
    deps = [],
}: PaginatedListOptions<TFilter, TScope, TItem>) {
    const list = useListFilters(initialFilter);
    const { data, loading, error, executeFetch } = useDataFetch<TItem[]>();

    const refresh = () => {
        if (!scope) return;
        executeFetch((isLatest) => {
            const requestList: ListFilters<TFilter> = {
                ...list,
                filters: list.appliedFilters,
                applyPagination: <T>(response: CollectionResponse<T>): T[] =>
                    isLatest() ? list.applyPagination(response) : response.data,
            };
            return fetchPage(requestList, scope);
        }, []);
    };

    useEffect(refresh, [scope, ...deps, list.page, list.limit, list.sort, list.appliedFilters]);

    return { list, items: data || [], loading, error, refresh };
}
