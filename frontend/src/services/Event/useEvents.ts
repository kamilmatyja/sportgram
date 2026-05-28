import {useEffect, useState} from 'react';
import {EventProvider} from '../../api/providers/EventProvider';
import {EventResponse} from '../../api/responses/EventResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../../api/queries/EventIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useEvents() {
    const access = useAppAccess();
    const eventProvider = new EventProvider();

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new EventFilterQuery());

    const fetchEvents = async () => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new EventFilterQuery();
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new EventIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await eventProvider.index(indexDto);
            setEvents(data);
        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchEvents();
        }
    }, [access.authLoading, access.authError, list.page, list.limit, list.sort, list.filters]);

    return {
        ...access,
        ...list,
        events,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        fetchEvents
    };
}