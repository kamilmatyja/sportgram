import { useEffect, useState } from 'react';

import { FeedProvider } from '../../api/providers/FeedProvider';
import { FeedFilterQuery } from '../../api/queries/FeedFilterQuery';
import { FeedIndexQuery } from '../../api/queries/FeedIndexQuery';
import { FEED_INCLUDES } from '../../api/queries/includes';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { collectFeedUserIds } from '../../utils/feed';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useListFilters } from '../../utils/hooks/useListFilters';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { useFeedInteractions } from '../Feed/useFeedInteractions';

export function useHomeFeeds(targetUserId?: string) {
    const access = useAppAccess(targetUserId ? { targetId: targetUserId, requireFriendship: true } : {});
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const list = useListFilters(new FeedFilterQuery(), 'createdAt:desc', 20);

    const { data: feeds, setData: setFeeds, loading, error, executeFetch } = useDataFetch<FeedResponse[]>();
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    const feedProvider = new FeedProvider();

    const fetchFeeds = (pageNumber: number, append: boolean = false) => {
        if (append) setLoadingMore(true);

        return executeFetch(async (isLatest) => {
            const filter = new FeedFilterQuery();
            filter.status = ElementStatusEnum.ACTIVE;
            filter.userId = targetUserId;

            const indexDto = list.buildIndexQuery(new FeedIndexQuery(), filter);
            indexDto.page = pageNumber;
            indexDto.include = FEED_INCLUDES;

            const response = await feedProvider.index(indexDto);
            const data = response.data;
            if (isLatest()) setHasMore(response.pagination.hasNextPage);
            await loadRelatedUsers(collectFeedUserIds(data));

            if (!append) return data;
            const current = feeds || [];
            return [...current, ...data.filter((df) => !current.some((pf) => pf.id === df.id))];
        }, feeds || []).finally(() => {
            if (append) setLoadingMore(false);
        });
    };

    useEffect(() => {
        const targetReady = !targetUserId || access.targetUser?.id === targetUserId;
        if (isAccessReady(access) && access.currentUser && targetReady) {
            list.setPage(1);
            fetchFeeds(1, false);
        }
    }, [access.authLoading, access.authError, access.currentUser, access.targetUser, targetUserId]);

    const handleLoadMore = () => {
        const nextPage = list.page + 1;
        fetchFeeds(nextPage, true).then((result) => {
            if (result) list.setPage(nextPage);
        });
    };

    const refreshSingleFeed = async (feedId: string) => {
        try {
            const updatedFeed = await feedProvider.details(feedId, FEED_INCLUDES);
            setFeeds((prev) => (prev || []).map((f) => (f.id === feedId ? updatedFeed : f)));
            await loadRelatedUsers(collectFeedUserIds([updatedFeed]));
        } catch (e) {
            console.error(e);
        }
    };

    const interactions = useFeedInteractions(feeds || [], access.currentUser, refreshSingleFeed);

    return {
        ...access,
        feeds: feeds || [],
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        loadingMore,
        hasMore,
        handleLoadMore,
        ...interactions,
    };
}
