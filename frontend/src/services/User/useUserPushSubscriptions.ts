import React, {useEffect, useState} from 'react';
import {PushSubscriptionProvider} from '../../api/providers/PushSubscriptionProvider';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {PushSubscriptionFilterQuery} from '../../api/queries/PushSubscriptionFilterQuery';
import {PushSubscriptionIndexQuery} from '../../api/queries/PushSubscriptionIndexQuery';
import {profileAccess} from '../../utils/profileAccess.ts';

export function useUserPushSubscriptions(link?: string) {
    const {checkAccess} = profileAccess();

    const [subscriptions, setSubscriptions] = useState<PushSubscriptionResponse[]>([]);
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new PushSubscriptionFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const pushSubscriptionProvider = new PushSubscriptionProvider();

    const fetchSubscriptions = async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const filterDto = new PushSubscriptionFilterQuery();
            filterDto.endpoint = filters.endpoint;
            filterDto.p256dh = filters.p256dh;
            filterDto.auth = filters.auth;

            const indexDto = new PushSubscriptionIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await pushSubscriptionProvider.index(indexDto);
            const userSubscriptions = data.filter(sub => sub.userId === userId);
            setSubscriptions(userSubscriptions);
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
                setIsAdmin(access.isAdmin);
                setIsMyProfile(access.isMyProfile);

                await fetchSubscriptions(access.targetUser.id);
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

    const refreshSubscriptions = () => {
        if (targetUser) fetchSubscriptions(targetUser.id);
    };

    return {
        subscriptions, targetUser, currentUser, isMyProfile, isAdmin, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshSubscriptions
    };
}