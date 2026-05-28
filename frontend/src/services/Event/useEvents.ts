import React, {useEffect, useState} from 'react';
import {EventProvider} from '../../api/providers/EventProvider';
import {EventResponse} from '../../api/responses/EventResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../../api/queries/EventIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useEvents() {
    const access = useAppAccess();
    const eventProvider = new EventProvider();

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new EventFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const fetchEvents = async () => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new EventFilterQuery();
            filterDto.title = filters.title;
            filterDto.link = filters.link;
            filterDto.status = filters.status ? Number(filters.status) : undefined;
            const indexDto = new EventIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
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
    }, [access.authLoading, access.authError, page, limit, sort, filters]);

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

    return {
        ...access,
        events,
        page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, fetchEvents
    };
}