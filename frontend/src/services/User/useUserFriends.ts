import {useEffect, useState} from 'react';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FriendIndexQuery} from '../../api/queries/FriendIndexQuery';
import {FriendFilterQuery} from '../../api/queries/FriendFilterQuery';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useUserFriends(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [friends, setFriends] = useState<FriendResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new FriendFilterQuery());

    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const fetchFriends = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new FriendFilterQuery();
            filterDto.userIds = [userId];
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new FriendIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await friendProvider.index(indexDto);
            setFriends(data);

            const userIdsToFetch = data.flatMap(f => [f.senderUserId, f.receiverUserId]);
            const updatedUsers = await fetchRelatedUsers(userIdsToFetch, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
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
        friends, relatedUsers,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshFriends
    };
}