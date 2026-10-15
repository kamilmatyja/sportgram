import { NotificationProvider } from '../../api/providers/NotificationProvider';
import { NotificationFilterQuery } from '../../api/queries/NotificationFilterQuery';
import { NotificationIndexQuery } from '../../api/queries/NotificationIndexQuery';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { toOptionalNumber } from '../../utils/query';

export function useUserNotifications(link?: string) {
    const access = useAppAccess({ targetLink: link, requireOwner: true });
    const notificationProvider = new NotificationProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new NotificationFilterQuery(),
        scope: isAccessReady(access) ? access.targetUser : null,
        fetchPage: async (list) => {
            const filterDto = new NotificationFilterQuery();
            filterDto.text = list.filters.text;
            filterDto.status = toOptionalNumber(list.filters.status);

            return list.applyPagination(
                await notificationProvider.index(list.buildIndexQuery(new NotificationIndexQuery(), filterDto)),
            );
        },
    });

    return {
        ...access,
        ...list,
        notifications: items,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshNotifications: refresh,
    };
}
