import { PushSubscriptionProvider } from '../../api/providers/PushSubscriptionProvider';
import { PushSubscriptionFilterQuery } from '../../api/queries/PushSubscriptionFilterQuery';
import { PushSubscriptionIndexQuery } from '../../api/queries/PushSubscriptionIndexQuery';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';

export function useUserPushSubscriptions(link?: string) {
    const access = useAppAccess({ targetLink: link, requireOwner: true });
    const pushSubscriptionProvider = new PushSubscriptionProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new PushSubscriptionFilterQuery(),
        scope: isAccessReady(access) ? access.targetUser : null,
        fetchPage: async (list, targetUser) => {
            const data = list.applyPagination(
                await pushSubscriptionProvider.index(
                    list.buildIndexQuery(new PushSubscriptionIndexQuery(), new PushSubscriptionFilterQuery()),
                ),
            );
            return data.filter((sub) => sub.userId === targetUser.id);
        },
    });

    return {
        ...access,
        ...list,
        subscriptions: items,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshSubscriptions: refresh,
    };
}
