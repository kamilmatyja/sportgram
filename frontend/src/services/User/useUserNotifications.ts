import React, {useEffect, useState} from 'react';
import {NotificationProvider} from '../../api/providers/NotificationProvider';
import {NotificationResponse} from '../../api/responses/NotificationResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {NotificationFilterQuery} from '../../api/queries/NotificationFilterQuery';
import {NotificationIndexQuery} from '../../api/queries/NotificationIndexQuery';
import {profileAccess} from '../../utils/profileAccess.ts';

export function useUserNotifications(link?: string) {
    const {checkAccess} = profileAccess();

    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new NotificationFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const notificationProvider = new NotificationProvider();

    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
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
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                if (!link) {
                    setError('userNotFound');
                    return;
                }

                const access = await checkAccess({ link }, { requireOwner: true });

                setCurrentUser(access.currentUser);
                setTargetUser(access.targetUser);
                setIsMyProfile(access.isMyProfile);

                await fetchNotifications();
            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [link, page, limit, sort, filters]);

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
        if (targetUser) fetchNotifications();
    };

    return {
        notifications, targetUser, currentUser, isMyProfile, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshNotifications
    };
}