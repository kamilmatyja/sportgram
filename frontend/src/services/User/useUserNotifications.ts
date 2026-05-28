import React, {useEffect, useState} from 'react';
import {NotificationProvider} from '../../api/providers/NotificationProvider';
import {NotificationResponse} from '../../api/responses/NotificationResponse';
import {NotificationFilterQuery} from '../../api/queries/NotificationFilterQuery';
import {NotificationIndexQuery} from '../../api/queries/NotificationIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useUserNotifications(link?: string) {
    const access = useAppAccess({ targetLink: link, requireOwner: true });

    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new NotificationFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const notificationProvider = new NotificationProvider();

    const fetchNotifications = async () => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new NotificationFilterQuery();
            filterDto.text = filters.text;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new NotificationIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await notificationProvider.index(indexDto);
            setNotifications(data);
        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchNotifications();
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

    const refreshNotifications = () => {
        if (access.targetUser) fetchNotifications();
    };

    return {
        ...access,
        notifications, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshNotifications
    };
}