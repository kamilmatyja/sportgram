import React, {useEffect, useState} from 'react';
import {PushSubscriptionProvider} from '../../api/providers/PushSubscriptionProvider';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {PushSubscriptionFilterQuery} from '../../api/queries/PushSubscriptionFilterQuery';
import {PushSubscriptionIndexQuery} from '../../api/queries/PushSubscriptionIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useUserPushSubscriptions(link?: string) {
    const access = useAppAccess({ targetLink: link, requireOwner: true });

    const [subscriptions, setSubscriptions] = useState<PushSubscriptionResponse[]>([]);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new PushSubscriptionFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const pushSubscriptionProvider = new PushSubscriptionProvider();

    const fetchSubscriptions = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
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
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchSubscriptions(access.targetUser.id);
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

    const refreshSubscriptions = () => {
        if (access.targetUser) fetchSubscriptions(access.targetUser.id);
    };

    return {
        ...access,
        subscriptions, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshSubscriptions
    };
}