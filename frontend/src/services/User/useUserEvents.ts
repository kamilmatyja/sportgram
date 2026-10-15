import { EventProvider } from '../../api/providers/EventProvider';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventIndexQuery } from '../../api/queries/EventIndexQuery';
import { EVENT_INCLUDES } from '../../api/queries/includes';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { toOptionalNumber } from '../../utils/query';

export function useUserEvents(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const eventProvider = new EventProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new EventFilterQuery(),
        scope: isAccessReady(access) ? access.targetUser : null,
        fetchPage: async (list, targetUser) => {
            const filterDto = new EventFilterQuery();
            filterDto.userId = targetUser.id;
            filterDto.title = list.filters.title;
            filterDto.status = toOptionalNumber(list.filters.status);

            const indexDto = list.buildIndexQuery(new EventIndexQuery(), filterDto);
            indexDto.include = EVENT_INCLUDES;

            return list.applyPagination(await eventProvider.index(indexDto));
        },
    });

    return {
        ...access,
        ...list,
        events: items,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshEvents: refresh,
    };
}
