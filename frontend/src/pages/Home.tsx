import { useState, useMemo, useRef, useCallback } from 'react';
import { Title, Text, Button, Group, Stack, Paper, Box, Card, Skeleton, Container } from '@mantine/core';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { feedService, storyService, type StoryResource, type FeedResource } from '../api/services';
import { useAuth } from '../auth';
import { EmptyState } from '../components';
import { RunnerLogo } from '../components';
import { StoryViewerModal, type UserStoriesGroup } from '../components';
import { FeedCard } from '../components';
import { FeedModal } from '../components';
import { StoriesBar } from '../components';
import { StoryModal } from '../components';
import { useUsersMap, useInfiniteScrollObserver } from '../hooks';
import { confirmDelete, notifyError, notifySuccess } from '../utils';
import { runWhenOnline } from '../hooks';

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
        queryFn: ({ pageParam = 1 }) =>
            feedService.getFeeds({
                params: {
                    query: {
                        page: pageParam,
                        limit: 10,
                        sort: 'createdAt:desc',
                        'include[]': ['feedComments', 'feedReactions', 'feedOrigin'],
                    },
                },
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.pagination?.hasNextPage && lastPage.pagination.page ? lastPage.pagination.page + 1 : undefined,
        enabled: isAuthenticated,
    });

    const feedsData = useMemo(() => {
        const list = feedsInfiniteData?.pages.flatMap((page) => page.data ?? []) ?? [];
        const parseTime = (dateStr?: string) => (dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0);
        return [...list].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
    }, [feedsInfiniteData]);

    const lastFeedElementRef = useInfiniteScrollObserver({
        isLoading: isFetchingMoreFeeds,
        hasNextPage: hasMoreFeeds,
        fetchNextPage: fetchNextFeedsPage,
    });

    const {
        data: storiesInfiniteData,
        isLoading: storiesLoading,
        fetchNextPage: fetchNextStoriesPage,
        hasNextPage: hasMoreStories,
        isFetchingNextPage: isFetchingMoreStories,
    } = useInfiniteQuery({
        queryKey: ['stories'],
        queryFn: ({ pageParam = 1 }) =>
            storyService.getStories({
                params: {
                    query: {
                        page: pageParam,
                        limit: 10,
                        sort: 'createdAt:desc',
                    },
                },
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.pagination?.hasNextPage && lastPage.pagination.page ? lastPage.pagination.page + 1 : undefined,
        enabled: isAuthenticated,
    });

    const storiesData = useMemo(
        () => storiesInfiniteData?.pages.flatMap((page) => page.data ?? []) ?? [],
        [storiesInfiniteData],
    );

    const storiesViewportRef = useRef<HTMLDivElement>(null);
    const handleStoriesScroll = useCallback(
        (position: { x: number; y: number }) => {
            const el = storiesViewportRef.current;
            if (!el || isFetchingMoreStories || !hasMoreStories) return;
            if (el.scrollWidth - el.clientWidth - position.x < 100) {
                runWhenOnline(() => void fetchNextStoriesPage());
            }
        },
        [isFetchingMoreStories, hasMoreStories, fetchNextStoriesPage],
    );

    const lastStoryElementRef = useInfiniteScrollObserver({
        isLoading: isFetchingMoreStories,
        hasNextPage: hasMoreStories,
        fetchNextPage: fetchNextStoriesPage,
        root: storiesViewportRef.current,
    });

    const relatedUserIds = useMemo(() => {
        const ids = new Set<string>();
        feedsData.forEach((f) => {
            if (f.userId) ids.add(f.userId);
            f.comments?.forEach((c) => c.userId && ids.add(c.userId));
            f.reactions?.forEach((r) => r.userId && ids.add(r.userId));
        });
        storiesData.forEach((s) => s.userId && ids.add(s.userId));
        return Array.from(ids);
    }, [feedsData, storiesData]);

    const { usersMap, isLoading: usersLoading } = useUsersMap(relatedUserIds);
    const isStoriesLoading = storiesLoading || (storiesData.length > 0 && usersLoading);
    const isFeedsLoading = feedsLoading || (relatedUserIds.length > 0 && usersLoading);

    const userStoryGroups = useMemo<UserStoriesGroup[]>(() => {
        if (!storiesData || storiesData.length === 0) return [];
        const map = new Map<string, StoryResource[]>();
        for (const story of storiesData) {
            if (!story.userId) continue;
            const list = map.get(story.userId) ?? [];
            list.push(story);
            map.set(story.userId, list);
        }

        const parseTime = (dateStr?: string) => (dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0);

        const groups: UserStoriesGroup[] = [];
        for (const [userId, userStories] of map.entries()) {
            const sortedStories = [...userStories].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
            const newestStory = sortedStories[0];
            const author = usersMap[userId] ?? (currentUser?.id === userId ? currentUser : undefined);

            groups.push({ userId, author, stories: sortedStories, newestStory });
        }

        return groups.sort((a, b) => parseTime(b.newestStory?.createdAt) - parseTime(a.newestStory?.createdAt));
    }, [storiesData, usersMap, currentUser]);

    const deleteStoryMutation = useMutation({
        mutationFn: (id: string) => storyService.deleteStory({ params: { path: { id } } }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifySuccess(t('deleted'), t('stories'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteFeedMutation = useMutation({
        mutationFn: (id: string) => feedService.deleteFeed({ params: { path: { id } } }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifySuccess(t('deleted'), t('feeds'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

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
                isLoading={isStoriesLoading}
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

            <Stack>
                {isFeedsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <Group mb="sm">
                                <Skeleton height={40} circle />
                                <Stack gap={6} flex={1}>
                                    <Skeleton height={14} width="40%" />
                                    <Skeleton height={10} width="20%" />
                                </Stack>
                            </Group>
                            <Skeleton height={50} mb="sm" />
                            <Skeleton height={180} radius="md" />
                        </Card>
                    ))
                ) : feedsData.length === 0 ? (
                    <EmptyState title={t('noData')} />
                ) : (
                    feedsData.map((feed, idx) => {
                        const author =
                            usersMap[feed.userId] ?? (currentUser?.id === feed.userId ? currentUser : undefined);
                        return (
                            <FeedCard
                                key={feed.id}
                                feed={feed}
                                author={author}
                                usersMap={usersMap}
                                onEditFeed={(f) => setEditingFeed(f)}
                                onDeleteFeed={(id) => confirmDelete(t, () => deleteFeedMutation.mutate(id))}
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
                onDelete={(id) => deleteStoryMutation.mutate(id)}
                updatedStory={updatedStoryForModal}
            />
        </Stack>
    );
}
