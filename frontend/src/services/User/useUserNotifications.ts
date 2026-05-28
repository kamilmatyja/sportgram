import {useEffect, useState} from 'react';
import {NotificationProvider} from '../../api/providers/NotificationProvider';
import {NotificationResponse} from '../../api/responses/NotificationResponse';
import {NotificationFilterQuery} from '../../api/queries/NotificationFilterQuery';
import {NotificationIndexQuery} from '../../api/queries/NotificationIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useUserNotifications(link?: string) {
    const access = useAppAccess({ targetLink: link, requireOwner: true });

    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new NotificationFilterQuery());
    const notificationProvider = new NotificationProvider();

    const fetchNotifications = async () => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new NotificationFilterQuery();
            filterDto.text = list.filters.text;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new NotificationIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
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
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshNotifications = () => {
        if (access.targetUser) fetchNotifications();
    };

    return {
        ...access,
        ...list,
        notifications,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshNotifications
    };
}