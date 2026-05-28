import {useEffect, useState} from 'react';
import {EventProvider} from '../../api/providers/EventProvider';
import {EventResponse} from '../../api/responses/EventResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../../api/queries/EventIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useUserEvents(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new EventFilterQuery());
    const eventProvider = new EventProvider();

    const fetchEvents = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new EventFilterQuery();
            filterDto.userId = userId;
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new EventIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await eventProvider.index(indexDto);

            const detailedEvents = await Promise.all(data.map(async (ev) => {
                return await eventProvider.details(ev.id, ['eventDisciplines', 'eventDisciplineDistances', 'eventDisciplineSubDistances']);
            }));

            setEvents(detailedEvents);
        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchEvents(access.targetUser.id);
        }
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshEvents = () => {
        if (access.targetUser) fetchEvents(access.targetUser.id);
    };

    return {
        ...access,
        ...list,
        events,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshEvents
    };
}