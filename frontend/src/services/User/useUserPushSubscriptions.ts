import {useEffect, useState} from 'react';
import {PushSubscriptionProvider} from '../../api/providers/PushSubscriptionProvider';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {PushSubscriptionFilterQuery} from '../../api/queries/PushSubscriptionFilterQuery';
import {PushSubscriptionIndexQuery} from '../../api/queries/PushSubscriptionIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useUserPushSubscriptions(link?: string) {
    const access = useAppAccess({ targetLink: link, requireOwner: true });

    const [subscriptions, setSubscriptions] = useState<PushSubscriptionResponse[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new PushSubscriptionFilterQuery());
    const pushSubscriptionProvider = new PushSubscriptionProvider();

    const fetchSubscriptions = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new PushSubscriptionFilterQuery();
            filterDto.endpoint = list.filters.endpoint;
            filterDto.p256dh = list.filters.p256dh;
            filterDto.auth = list.filters.auth;

            const indexDto = new PushSubscriptionIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
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
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshSubscriptions = () => {
        if (access.targetUser) fetchSubscriptions(access.targetUser.id);
    };

    return {
        ...access,
        ...list,
        subscriptions,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshSubscriptions
    };
}