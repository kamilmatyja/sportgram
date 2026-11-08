import { useState, useMemo, useRef, useCallback } from 'react';
import { Title, Text, Button, Group, Stack, Paper, Box, Card, Skeleton, Container } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { feedService, storyService, type StoryResource, type FeedResource } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { StoryViewerModal, type UserStoriesGroup } from '../components/StoryViewerModal';
import { RunnerLogo } from '../components/RunnerLogo';
import { EmptyState } from '../components/EmptyState';
import { openConfirmActionModal } from '../utils/confirmModal';
import { FeedCard } from '../components/feed/FeedCard';
import { FeedModal } from '../components/feed/FeedModal';
import { StoryModal } from '../components/story/StoryModal';
import { StoriesBar } from '../components/story/StoriesBar';
import { useUsersMap } from '../hooks/useUsersMap';

export default function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated, currentUser } = useAuth();

    const [storyModalOpened, setStoryModalOpened] = useState(false);
    const [feedModalOpened, setFeedModalOpened] = useState(false);

    const [editingStory, setEditingStory] = useState<StoryResource | null>(null);
    const [updatedStoryForModal, setUpdatedStoryForModal] = useState<StoryResource | null>(null);

    const [editingFeed, setEditingFeed] = useState<FeedResource | null>(null);

    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
    const [storyViewerOpened, setStoryViewerOpened] = useState(false);

    const {
        data: feedsInfiniteData,
        isLoading: feedsLoading,
        fetchNextPage: fetchNextFeedsPage,
        hasNextPage: hasMoreFeeds,
        isFetchingNextPage: isFetchingMoreFeeds,
    } = useInfiniteQuery({
        queryKey: ['feeds'],
        queryFn: async ({ pageParam = 1 }) => {
            return await feedService.getFeeds({
                params: {
                    query: {
                        page: pageParam,
                        limit: 10,
                        sort: 'createdAt:desc',
                        'include[]': ['feedComments', 'feedReactions', 'feedOrigin'],
                    },
                },
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const p = lastPage.pagination;
            if (p?.hasNextPage && p?.page) {
                return p.page + 1;
            }
            return undefined;
        },
        enabled: isAuthenticated,
    });

    const feedsData = useMemo(() => {
        return feedsInfiniteData?.pages.flatMap((page) => page.data ?? []) ?? [];
    }, [feedsInfiniteData]);

    const feedObserver = useRef<IntersectionObserver | null>(null);
    const lastFeedElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isFetchingMoreFeeds) return;
            if (feedObserver.current) feedObserver.current.disconnect();
            if (!node) return;
            feedObserver.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMoreFeeds) {
                    fetchNextFeedsPage();
                }
            });
            feedObserver.current.observe(node);
        },
        [isFetchingMoreFeeds, hasMoreFeeds, fetchNextFeedsPage],
    );

    const {
        data: storiesInfiniteData,
        fetchNextPage: fetchNextStoriesPage,
        hasNextPage: hasMoreStories,
        isFetchingNextPage: isFetchingMoreStories,
    } = useInfiniteQuery({
        queryKey: ['stories'],
        queryFn: async ({ pageParam = 1 }) => {
            return await storyService.getStories({
                params: {
                    query: {
                        page: pageParam,
                        limit: 10,
                        sort: 'createdAt:desc',
                    },
                },
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const p = lastPage.pagination;
            if (p?.hasNextPage && p?.page) {
                return p.page + 1;
            }
            return undefined;
        },
        enabled: isAuthenticated,
    });

    const storiesData = useMemo(() => {
        return storiesInfiniteData?.pages.flatMap((page) => page.data ?? []) ?? [];
    }, [storiesInfiniteData]);

    const storiesViewportRef = useRef<HTMLDivElement>(null);
    const handleStoriesScroll = useCallback(
        (position: { x: number; y: number }) => {
            const el = storiesViewportRef.current;
            if (!el || isFetchingMoreStories || !hasMoreStories) return;
            const scrollRight = el.scrollWidth - el.clientWidth - position.x;
            if (scrollRight < 100) {
                fetchNextStoriesPage();
            }
        },
        [isFetchingMoreStories, hasMoreStories, fetchNextStoriesPage],
    );

    const storyObserver = useRef<IntersectionObserver | null>(null);
    const lastStoryElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isFetchingMoreStories) return;
            if (storyObserver.current) storyObserver.current.disconnect();
            if (!node) return;
            storyObserver.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMoreStories) {
                        fetchNextStoriesPage();
                    }
                },
                { root: storiesViewportRef.current },
            );
            storyObserver.current.observe(node);
        },
        [isFetchingMoreStories, hasMoreStories, fetchNextStoriesPage],
    );

    const relatedUserIds = useMemo(() => {
        const ids: string[] = [];
        feedsData?.forEach((f) => {
            if (f.userId) ids.push(f.userId);
            f.comments?.forEach((c) => {
                if (c.userId) ids.push(c.userId);
            });
            f.reactions?.forEach((r) => {
                if (r.userId) ids.push(r.userId);
            });
        });
        storiesData?.forEach((s) => {
            if (s.userId) ids.push(s.userId);
        });
        return Array.from(new Set(ids));
    }, [feedsData, storiesData]);

    const { usersMap } = useUsersMap(relatedUserIds);

    const userStoryGroups = useMemo<UserStoriesGroup[]>(() => {
        if (!storiesData || storiesData.length === 0) return [];
        const map = new Map<string, StoryResource[]>();
        for (const story of storiesData) {
            if (!story.userId) continue;
            if (!map.has(story.userId)) {
                map.set(story.userId, []);
            }
            map.get(story.userId)!.push(story);
        }

        const parseTime = (dateStr?: string) => (dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0);

        const groups: UserStoriesGroup[] = [];
        for (const [userId, userStories] of map.entries()) {
            const sortedStories = [...userStories].sort((a, b) => parseTime(a.createdAt) - parseTime(b.createdAt));
            const newestStory = [...userStories].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt))[0];
            const author = usersMap[userId] ?? (currentUser?.id === userId ? currentUser : undefined);

            groups.push({
                userId,
                author,
                stories: sortedStories,
                newestStory,
            });
        }

        groups.sort((a, b) => {
            const timeA = parseTime(a.newestStory?.createdAt);
            const timeB = parseTime(b.newestStory?.createdAt);
            return timeB - timeA;
        });

        return groups;
    }, [storiesData, usersMap, currentUser]);

    const deleteStoryMutation = useMutation({
        mutationFn: async (id: string) => {
            await storyService.deleteStory({
                params: { path: { id } },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDeleteStory = (id: string) => {
        deleteStoryMutation.mutate(id);
    };

    const deleteFeedMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteFeed({
                params: { path: { id } },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDeleteFeed = (id: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteFeedMutation.mutate(id),
        });
    };

    if (!isAuthenticated) {
        return (
            <Container size="xs" py="xl">
                <Paper p="xl" ta="center">
                    <Box mb="md">
                        <RunnerLogo size={64} />
                    </Box>
                    <Title order={2} mb="sm">
                        {t('guestHomeTitle')}
                    </Title>
                    <Text c="dimmed" size="md" mb="xl">
                        {t('guestHomeSubtitle')}
                    </Text>
                    <Group justify="center">
                        <Button size="md" onClick={() => navigate('/sign')}>
                            {t('sign')}
                        </Button>
                        <Button size="md" variant="outline" onClick={() => navigate('/register')}>
                            {t('register')}
                        </Button>
                    </Group>
                </Paper>
            </Container>
        );
    }

    return (
        <Stack gap="xl">
            <StoriesBar
                groups={userStoryGroups}
                onSelectGroup={(idx) => {
                    setSelectedGroupIndex(idx);
                    setStoryViewerOpened(true);
                }}
                onAddStory={() => setStoryModalOpened(true)}
                onAddFeed={() => setFeedModalOpened(true)}
                isFetchingMore={isFetchingMoreStories}
                viewportRef={storiesViewportRef}
                onScrollPositionChange={handleStoriesScroll}
                lastStoryElementRef={lastStoryElementRef}
            />

            <Stack gap="md">
                {feedsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <Group gap="sm" mb="sm">
                                <Skeleton height={40} circle />
                                <Stack gap={6} flex={1}>
                                    <Skeleton height={14} width="40%" />
                                    <Skeleton height={10} width="20%" />
                                </Stack>
                            </Group>
                            <Skeleton height={50} radius="sm" mb="sm" />
                            <Skeleton height={180} radius="md" />
                        </Card>
                    ))
                ) : feedsData?.length === 0 ? (
                    <EmptyState title={t('noData')} />
                ) : (
                    feedsData?.map((feed, idx) => {
                        const author =
                            usersMap[feed.userId] ?? (currentUser?.id === feed.userId ? currentUser : undefined);
                        return (
                            <FeedCard
                                key={feed.id}
                                feed={feed}
                                author={author}
                                usersMap={usersMap}
                                onEditFeed={(f) => setEditingFeed(f)}
                                onDeleteFeed={handleDeleteFeed}
                                domRef={idx === feedsData.length - 1 ? lastFeedElementRef : undefined}
                            />
                        );
                    })
                )}

                {isFetchingMoreFeeds && (
                    <Text ta="center" size="sm" c="dimmed">
                        {t('loadingMore')}
                    </Text>
                )}
            </Stack>

            <StoryModal opened={storyModalOpened} onClose={() => setStoryModalOpened(false)} />

            <StoryModal
                opened={!!editingStory}
                story={editingStory}
                onClose={() => setEditingStory(null)}
                onSuccess={(updated) => {
                    if (updated) setUpdatedStoryForModal(updated);
                }}
            />

            <FeedModal opened={feedModalOpened} onClose={() => setFeedModalOpened(false)} />

            <FeedModal opened={!!editingFeed} feed={editingFeed} onClose={() => setEditingFeed(null)} />

            <StoryViewerModal
                opened={storyViewerOpened}
                onClose={() => setStoryViewerOpened(false)}
                groups={userStoryGroups}
                initialGroupIndex={selectedGroupIndex}
                onEdit={(story) => setEditingStory(story)}
                onDelete={handleDeleteStory}
                updatedStory={updatedStoryForModal}
            />
        </Stack>
    );
}
