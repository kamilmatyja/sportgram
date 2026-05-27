import React, {useEffect, useState} from 'react';
import {EventProvider} from '../api/providers/EventProvider';
import {EventResponse} from '../api/responses/EventResponse';
import {EventFilterQuery} from '../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../api/queries/EventIndexQuery';
import {useCheckPermission} from '../utils/checkPermission';
import {RoleEnum} from '../enums/RoleEnum';
import {UserResponse} from '../api/responses/UserResponse';

export function useEvents() {
    const {getCurrentUser} = useCheckPermission();
    const eventProvider = new EventProvider();

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isOrganizer, setIsOrganizer] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new EventFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
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
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAccessAndFetch = async () => {
            try {
                setLoading(true);
                const currentUsr = await getCurrentUser();
                setCurrentUser(currentUsr);

                if (currentUsr) {
                    setIsOrganizer(currentUsr.roles?.some((r: any) => r.role === RoleEnum.ORGANIZER) ?? false);
                }

                await fetchEvents();
            } catch (err: any) {
                setError(err.error);
                setLoading(false);
            }
        };

        checkAccessAndFetch();
    }, [page, limit, sort, filters]);

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
        events, currentUser, isOrganizer, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, fetchEvents
    };
}