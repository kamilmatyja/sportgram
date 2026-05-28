import React, {useEffect, useState} from 'react';
import {EventProvider} from '../../api/providers/EventProvider';
import {EventResponse} from '../../api/responses/EventResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../../api/queries/EventIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useUserEvents(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new EventFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const eventProvider = new EventProvider();

    const fetchEvents = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new EventFilterQuery();
            filterDto.userId = userId;
            filterDto.title = filters.title;
            filterDto.link = filters.link;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new EventIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
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
    }, [access.authLoading, access.authError, access.targetUser, page, limit, sort, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
        setPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPage(prev => prev + 1);

    const refreshEvents = () => {
        if (access.targetUser) fetchEvents(access.targetUser.id);
    };

    return {
        ...access,
        events, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshEvents
    };
}