import { useEffect, useState } from 'react';

import { FriendProvider } from '../../api/providers/FriendProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../../api/queries/FriendIndexQuery';
import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { fetchRelatedUsers } from '../../utils/fetchRelatedUsers';
import { useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useListFilters } from '../../utils/hooks/useListFilters';

export function useUserFriends(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const list = useListFilters(new FriendFilterQuery());

    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const { data: friends, loading, error, executeFetch } = useDataFetch<FriendResponse[]>();

    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const fetchFriends = (userId: string) => {
        executeFetch(async () => {
            const filterDto = new FriendFilterQuery();
            filterDto.userIds = [userId];
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new FriendIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await friendProvider.index(indexDto);

            const userIdsToFetch = data.flatMap((f) => [f.senderUserId, f.receiverUserId]);
            const updatedUsers = await fetchRelatedUsers(userIdsToFetch, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

            return data;
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchFriends(access.targetUser.id);
        }
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshFriends = () => {
        if (access.targetUser) fetchFriends(access.targetUser.id);
    };

    return {
        ...access,
        ...list,
        friends: friends || [],
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshFriends,
    };
}
