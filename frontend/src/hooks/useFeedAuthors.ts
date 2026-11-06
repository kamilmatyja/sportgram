import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { feedService, userService, type FeedResource, type UserResource } from '../api/services';

export function useFeedAuthors(feedIds: (string | undefined | null)[]) {
    const cleanFeedIds = useMemo(() => {
        const set = new Set<string>();
        for (const id of feedIds) {
            if (id) set.add(id);
        }
        return Array.from(set);
    }, [feedIds]);

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

    const feedsMap = useMemo(() => {
        const map: Record<string, FeedResource> = {};
        feeds.forEach((f) => {
            map[f.id] = f;
        });
        return map;
    }, [feeds]);

    const authorIds = useMemo(() => {
        const set = new Set<string>();
        feeds.forEach((f) => {
            if (f.userId) set.add(f.userId);
        });
        return Array.from(set);
    }, [feeds]);

    const { data: authors = {}, isLoading: authorsLoading } = useQuery({
        queryKey: ['feed-authors-by-ids', authorIds],
        queryFn: async () => {
            if (authorIds.length === 0) return {};
            const res = await userService.getUsers({
                params: {
                    query: {
                        filter: { userIds: authorIds },
                        limit: 100,
                    },
                },
            });
            const users = res.data ?? [];
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: authorIds.length > 0,
    });

    return {
        feedsMap,
        authorsMap: authors,
        getAuthorLink: (feedId: string) => {
            const feed = feedsMap[feedId];
            if (!feed) return null;
            return authors[feed.userId]?.link ?? null;
        },
        getAuthor: (feedId: string) => {
            const feed = feedsMap[feedId];
            if (!feed) return undefined;
            return authors[feed.userId];
        },
        isLoading: feedsLoading || authorsLoading,
    };
}
