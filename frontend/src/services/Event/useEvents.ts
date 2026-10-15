import { EventProvider } from '../../api/providers/EventProvider';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventIndexQuery } from '../../api/queries/EventIndexQuery';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { toOptionalNumber } from '../../utils/query';

export function useEvents() {
    const access = useAppAccess();
    const eventProvider = new EventProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new EventFilterQuery(),
        scope: isAccessReady(access) ? access.currentUser : null,
        fetchPage: async (list) => {
            const filterDto = new EventFilterQuery();
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = toOptionalNumber(list.filters.status);

            return list.applyPagination(
                await eventProvider.index(list.buildIndexQuery(new EventIndexQuery(), filterDto)),
            );
        },
    });

    return {
        ...access,
        ...list,
        events: items,
        loading: access.authLoading || loading,
        error: access.authError || error,
        fetchEvents: refresh,
    };
}
