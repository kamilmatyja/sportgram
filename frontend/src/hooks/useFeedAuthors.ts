import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { feedService, type FeedResource } from '../api/services';
import { useUsersMap } from './useUsersMap';

export function useFeedAuthors(feedIds: (string | undefined | null)[]) {
    const cleanFeedIds = useMemo(() => Array.from(new Set(feedIds.filter((id): id is string => !!id))), [feedIds]);

    const { data: feeds = [], isLoading: feedsLoading } = useQuery({
        queryKey: ['feeds-by-ids', cleanFeedIds],
        queryFn: async () => {
            if (cleanFeedIds.length === 0) return [];
            const results = await Promise.allSettled(
                cleanFeedIds.map(async (id) => {
                    const res = await feedService.getFeed({ params: { path: { id } } });
                    return res.data;
                }),
            );
            return results
                .filter((r): r is PromiseFulfilledResult<FeedResource> => r.status === 'fulfilled' && !!r.value)
                .map((r) => r.value);
        },
        enabled: cleanFeedIds.length > 0,
    });

    const feedsMap = useMemo(
        () => Object.fromEntries(feeds.map((f) => [f.id, f])) as Record<string, FeedResource>,
        [feeds],
    );

    const authorIds = useMemo(() => Array.from(new Set(feeds.map((f) => f.userId).filter(Boolean))), [feeds]);

    const { usersMap: authorsMap, isLoading: authorsLoading } = useUsersMap(authorIds);

    return {
        feedsMap,
        authorsMap,
        getAuthorLink: (feedId: string) => {
            const feed = feedsMap[feedId];
            return feed ? (authorsMap[feed.userId]?.link ?? null) : null;
        },
        isLoading: feedsLoading || authorsLoading,
    };
}
