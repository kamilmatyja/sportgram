import { PageProvider } from '../../api/providers/PageProvider';
import { PAGE_INCLUDES } from '../../api/queries/includes';
import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { PageIndexQuery } from '../../api/queries/PageIndexQuery';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { toOptionalNumber } from '../../utils/query';

export function useUserPages(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const pageProvider = new PageProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new PageFilterQuery(),
        scope: isAccessReady(access) ? access.targetUser : null,
        fetchPage: async (list, targetUser) => {
            const filterDto = new PageFilterQuery();
            filterDto.userId = targetUser.id;
            filterDto.title = list.filters.title;
            filterDto.status = toOptionalNumber(list.filters.status);

            const indexDto = list.buildIndexQuery(new PageIndexQuery(), filterDto);
            indexDto.include = PAGE_INCLUDES;

            const data = list.applyPagination(await pageProvider.index(indexDto));
            await loadRelatedUsers(
                data.flatMap((p) => [
                    ...p.participants.map((part) => part.userId),
                    ...(p.follows?.map((f) => f.userId) || []),
                ]),
            );

            return data;
        },
    });

    return {
        ...access,
        ...list,
        pages: items,
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshPages: refresh,
    };
}
