import {useEffect} from 'react';
import {NotificationProvider} from '../../api/providers/NotificationProvider';
import {NotificationResponse} from '../../api/responses/NotificationResponse';
import {NotificationFilterQuery} from '../../api/queries/NotificationFilterQuery';
import {NotificationIndexQuery} from '../../api/queries/NotificationIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';
import {useDataFetch} from '../../utils/hooks/useDataFetch';

export function useUserNotifications(link?: string) {
    const access = useAppAccess({ targetLink: link, requireOwner: true });
    const list = useListFilters(new NotificationFilterQuery());
    const notificationProvider = new NotificationProvider();

    const { data: notifications, loading, error, executeFetch } = useDataFetch<NotificationResponse[]>();

    const fetchNotifications = () => {
        executeFetch(async () => {
            const filterDto = new NotificationFilterQuery();
            filterDto.text = list.filters.text;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new NotificationIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            return await notificationProvider.index(indexDto);
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchNotifications();
        }
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshNotifications = () => {
        if (access.targetUser) fetchNotifications();
    };

    return {
        ...access,
        ...list,
        notifications: notifications || [],
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshNotifications
    };
}