import { FriendProvider } from '../../api/providers/FriendProvider';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../../api/queries/FriendIndexQuery';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { toOptionalNumber } from '../../utils/query';

export function useUserFriends(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const friendProvider = new FriendProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new FriendFilterQuery(),
        scope: isAccessReady(access) ? access.targetUser : null,
        fetchPage: async (list, targetUser) => {
            const filterDto = new FriendFilterQuery();
            filterDto.userIds = [targetUser.id];
            filterDto.status = toOptionalNumber(list.filters.status);

            const data = list.applyPagination(
                await friendProvider.index(list.buildIndexQuery(new FriendIndexQuery(), filterDto)),
            );
            await loadRelatedUsers(data.flatMap((f) => [f.senderUserId, f.receiverUserId]));

            return data;
        },
    });

    return {
        ...access,
        ...list,
        friends: items,
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshFriends: refresh,
    };
}
