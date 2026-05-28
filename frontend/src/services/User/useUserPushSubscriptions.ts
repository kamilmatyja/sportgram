import {useEffect} from 'react';
import {PushSubscriptionProvider} from '../../api/providers/PushSubscriptionProvider';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {PushSubscriptionFilterQuery} from '../../api/queries/PushSubscriptionFilterQuery';
import {PushSubscriptionIndexQuery} from '../../api/queries/PushSubscriptionIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';
import {useDataFetch} from '../../utils/hooks/useDataFetch';

export function useUserPushSubscriptions(link?: string) {
    const access = useAppAccess({ targetLink: link, requireOwner: true });
    const list = useListFilters(new PushSubscriptionFilterQuery());
    const pushSubscriptionProvider = new PushSubscriptionProvider();

    const { data: subscriptions, loading, error, executeFetch } = useDataFetch<PushSubscriptionResponse[]>();

    const fetchSubscriptions = (userId: string) => {
        executeFetch(async () => {
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
            return data.filter(sub => sub.userId === userId);
        }, []);
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
        subscriptions: subscriptions || [],
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshSubscriptions
    };
}