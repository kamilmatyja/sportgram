import { PageProvider } from '../../api/providers/PageProvider';
import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { PageIndexQuery } from '../../api/queries/PageIndexQuery';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { toOptionalNumber } from '../../utils/query';

export function usePages() {
    const access = useAppAccess();
    const pageProvider = new PageProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new PageFilterQuery(),
        scope: isAccessReady(access) ? access.currentUser : null,
        fetchPage: async (list) => {
            const filterDto = new PageFilterQuery();
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = toOptionalNumber(list.filters.status);

            return list.applyPagination(
                await pageProvider.index(list.buildIndexQuery(new PageIndexQuery(), filterDto)),
            );
        },
    });

    return {
        ...access,
        ...list,
        pages: items,
        loading: access.authLoading || loading,
        error: access.authError || error,
        fetchPages: refresh,
    };
}
