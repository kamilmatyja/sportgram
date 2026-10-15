import { FeedProvider } from '../../api/providers/FeedProvider';
import { FeedFilterQuery } from '../../api/queries/FeedFilterQuery';
import { FeedIndexQuery } from '../../api/queries/FeedIndexQuery';
import { FEED_INCLUDES } from '../../api/queries/includes';
import { collectFeedUserIds } from '../../utils/feed';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { toOptionalNumber } from '../../utils/query';

export function useUserFeeds(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const feedProvider = new FeedProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new FeedFilterQuery(),
        scope: isAccessReady(access) ? access.targetUser : null,
        fetchPage: async (list, targetUser) => {
            const filterDto = new FeedFilterQuery();
            filterDto.userId = targetUser.id;
            filterDto.text = list.filters.text;
            filterDto.status = toOptionalNumber(list.filters.status);

            const indexDto = list.buildIndexQuery(new FeedIndexQuery(), filterDto);
            indexDto.include = FEED_INCLUDES;

            const data = list.applyPagination(await feedProvider.index(indexDto));
            await loadRelatedUsers(collectFeedUserIds(data));

            return data;
        },
    });

    return {
        ...access,
        ...list,
        feeds: items,
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshFeeds: refresh,
    };
}
