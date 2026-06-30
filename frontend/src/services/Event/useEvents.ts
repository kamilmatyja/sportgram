import { useEffect } from 'react';

import { EventProvider } from '../../api/providers/EventProvider';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventIndexQuery } from '../../api/queries/EventIndexQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useListFilters } from '../../utils/hooks/useListFilters';

export function useEvents() {
    const access = useAppAccess();
    const eventProvider = new EventProvider();
    const list = useListFilters(new EventFilterQuery());
    const { data, loading, error, executeFetch } = useDataFetch<EventResponse[]>();

    const fetchEvents = () => {
        executeFetch(async () => {
            const filterDto = new EventFilterQuery();
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new EventIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            return await eventProvider.index(indexDto);
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchEvents();
        }
    }, [access.authLoading, access.authError, list.page, list.limit, list.sort, list.filters]);

    return {
        ...access,
        ...list,
        events: data || [],
        loading: access.authLoading || loading,
        error: access.authError || error,
        fetchEvents,
    };
}
