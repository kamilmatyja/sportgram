import { useState, useMemo, useRef, useCallback } from 'react';
import {
    Card,
    Title,
    Text,
    Button,
    Group,
    Stack,
    Avatar,
    Textarea,
    FileInput,
    Paper,
    ActionIcon,
    Modal,
    ScrollArea,
    Collapse,
    TextInput,
    Box,
    Image,
    Tooltip,
    Skeleton,
    Container,
    Center,
    Loader,
    Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconMessageCircle, IconTrash, IconPhoto, IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../api/client';
import {
    feedService,
    storyService,
    userService,
    type StoryResource,
    type FeedResource,
    type UserResource,
    type FeedReactionResource,
} from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { StoryViewerModal, type UserStoriesGroup } from '../components/StoryViewerModal';
import { RunnerLogo } from '../components/RunnerLogo';
import { EmptyState } from '../components/EmptyState';
import { EntityViewCounter } from '../components/EntityViewCounter';
import { EntryTypeEnum } from '../enums/EntryTypeEnum';
import { openConfirmActionModal } from '../utils/confirmModal';
import { FeedReactionEnum } from '../enums/FeedReactionEnum';
import { fileToBase64, formatImageSrc } from '../utils/imageUtils';
import { formatDateTime } from '../utils/date';
import { formatFeedOrigin } from '../utils/text';

export default function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated, currentUser } = useAuth();

    const [storyOpened, { open: openStoryModal, close: closeStoryModal }] = useDisclosure(false);
    const [storyText, setStoryText] = useState('');
    const [storyPhoto, setStoryPhoto] = useState<File | null>(null);

    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
    const [storyViewerOpened, setStoryViewerOpened] = useState(false);

    const [editingStory, setEditingStory] = useState<StoryResource | null>(null);
    const [updatedStoryForModal, setUpdatedStoryForModal] = useState<StoryResource | null>(null);
    const [editStoryOpened, { open: openEditStoryModal, close: closeEditStoryModal }] = useDisclosure(false);
    const [editStoryText, setEditStoryText] = useState('');
    const [editStoryPhoto, setEditStoryPhoto] = useState<File | null>(null);
    const [editStoryFieldErrors, setEditStoryFieldErrors] = useState<Record<string, string>>({});

    const [feedOpened, { open: openFeedModal, close: closeFeedModal }] = useDisclosure(false);
    const [feedText, setFeedText] = useState('');
    const [feedPhoto, setFeedPhoto] = useState<File | null>(null);
    const [feedFieldErrors, setFeedFieldErrors] = useState<Record<string, string>>({});
    const [storyFieldErrors, setStoryFieldErrors] = useState<Record<string, string>>({});

    const [editingFeed, setEditingFeed] = useState<FeedResource | null>(null);
    const [editFeedOpened, { open: openEditFeedModal, close: closeEditFeedModal }] = useDisclosure(false);
    const [editFeedText, setEditFeedText] = useState('');
    const [editFeedPhoto, setEditFeedPhoto] = useState<File | null>(null);
    const [editFeedFieldErrors, setEditFeedFieldErrors] = useState<Record<string, string>>({});

    const [openCommentsFeedId, setOpenCommentsFeedId] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

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
                page: pageParam,
                limit: 10,
                sort: 'createdAt:desc',
                'include[]': ['feedComments', 'feedReactions', 'feedOrigin'],
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
                page: pageParam,
                limit: 10,
                sort: 'createdAt:desc',
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
        ({ x }: { x: number }) => {
            if (!storiesViewportRef.current || !hasMoreStories || isFetchingMoreStories) return;
            const { scrollWidth, clientWidth } = storiesViewportRef.current;
            if (x + clientWidth >= scrollWidth - 60) {
                fetchNextStoriesPage();
            }
        },
        [hasMoreStories, isFetchingMoreStories, fetchNextStoriesPage],
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

    const { data: usersMapData } = useQuery({
        queryKey: ['feed-users', relatedUserIds],
        queryFn: async (): Promise<Record<string, UserResource>> => {
            if (relatedUserIds.length === 0) return {};
            const users = await userService.getUsersByIds(relatedUserIds);
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: relatedUserIds.length > 0,
    });

    const usersMap: Record<string, UserResource> = usersMapData ?? {};

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

    const createFeedMutation = useMutation({
        mutationFn: async () => {
            if (!feedPhoto) throw new Error(t('selectPhoto'));
            const photoStr = await fileToBase64(feedPhoto);
            return await feedService.createFeed({ text: feedText, photo: photoStr });
        },
        onSuccess: () => {
            setFeedText('');
            setFeedPhoto(null);
            setFeedFieldErrors({});
            closeFeedModal();
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedAdded'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFeedFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateFeedMutation = useMutation({
        mutationFn: async () => {
            if (!editingFeed) return;
            let photoStr = editingFeed.photo;
            if (editFeedPhoto) {
                photoStr = await fileToBase64(editFeedPhoto);
            }
            await feedService.updateFeed(editingFeed.id, {
                text: editFeedText,
                photo: photoStr ?? '',
            });
        },
        onSuccess: () => {
            closeEditFeedModal();
            setEditingFeed(null);
            setEditFeedPhoto(null);
            setEditFeedFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFeedFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEditFeed = (feed: FeedResource) => {
        setEditingFeed(feed);
        setEditFeedText(feed.text || '');
        setEditFeedPhoto(null);
        setEditFeedFieldErrors({});
        openEditFeedModal();
    };

    const createStoryMutation = useMutation({
        mutationFn: async () => {
            if (!storyPhoto) throw new Error(t('selectPhoto'));
            const photoStr = await fileToBase64(storyPhoto);
            return await storyService.createStory({ text: storyText, photo: photoStr });
        },
        onSuccess: () => {
            setStoryText('');
            setStoryPhoto(null);
            setStoryFieldErrors({});
            closeStoryModal();
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyAdded'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setStoryFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateStoryMutation = useMutation({
        mutationFn: async () => {
            if (!editingStory) return null;
            let photoStr = editingStory.photo;
            if (editStoryPhoto) {
                photoStr = await fileToBase64(editStoryPhoto);
            }
            await storyService.updateStory(editingStory.id, {
                text: editStoryText,
                photo: photoStr ?? '',
            });
            const res = await storyService.getStory(editingStory.id);
            return res.data ?? null;
        },
        onSuccess: (freshStory) => {
            closeEditStoryModal();
            setEditingStory(null);
            setEditStoryPhoto(null);
            setEditStoryFieldErrors({});
            if (freshStory) {
                setUpdatedStoryForModal(freshStory);
            }
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditStoryFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEditStory = (story: StoryResource) => {
        setEditingStory(story);
        setEditStoryText(story.text || '');
        setEditStoryPhoto(null);
        setEditStoryFieldErrors({});
        openEditStoryModal();
    };

    const deleteStoryMutation = useMutation({
        mutationFn: async (id: string) => {
            await storyService.deleteStory(id);
        },
        onSuccess: () => {
            setStoryViewerOpened(false);
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDeleteStory = (id: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteStoryMutation.mutate(id),
        });
    };

    const deleteFeedMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteFeed(id);
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

    const handleDeleteComment = (id: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteCommentMutation.mutate(id),
        });
    };

    const addReactionMutation = useMutation({
        mutationFn: async ({ feedId, type }: { feedId: string; type: number }) => {
            await feedService.addReaction(feedId, type);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('reactions'), message: t('reactionAdded'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateReactionMutation = useMutation({
        mutationFn: async ({ reactionId, type }: { reactionId: string; type: number }) => {
            await feedService.updateReaction(reactionId, type);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('reactions'), message: t('reactionUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteReactionMutation = useMutation({
        mutationFn: async (reactionId: string) => {
            await feedService.deleteReaction(reactionId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('reactions'), message: t('reactionDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleReaction = (feedId: string, type: number, myReaction?: FeedReactionResource) => {
        if (!myReaction) {
            addReactionMutation.mutate({ feedId, type });
        } else if (myReaction.reaction === type) {
            deleteReactionMutation.mutate(myReaction.id);
        } else {
            updateReactionMutation.mutate({ reactionId: myReaction.id, type });
        }
    };

    const addCommentMutation = useMutation({
        mutationFn: async ({ feedId, text }: { feedId: string; text: string }) => {
            await feedService.addComment(feedId, text);
        },
        onSuccess: (_data, variables) => {
            setCommentInputs((prev) => ({ ...prev, [variables.feedId]: '' }));
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('comments'), message: t('commentAdded'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateCommentMutation = useMutation({
        mutationFn: async ({ id, text }: { id: string; text: string }) => {
            await feedService.updateComment(id, { text });
        },
        onSuccess: () => {
            setEditingCommentId(null);
            setEditingCommentText('');
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('comments'), message: t('commentUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteCommentMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteComment(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('comments'), message: t('commentDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    if (!isAuthenticated) {
        return (
            <Container size="xs" py="xl">
                <Paper withBorder shadow="sm" p="xl" radius="md" ta="center">
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
            <Card withBorder radius="md" p="md" shadow="xs">
                <ScrollArea
                    type="never"
                    offsetScrollbars
                    viewportRef={storiesViewportRef}
                    onScrollPositionChange={handleStoriesScroll}
                >
                    <Group gap="md" wrap="nowrap">
                        <Stack align="center" gap={4} className="pointer" onClick={openStoryModal} miw={64}>
                            <Avatar radius="xl" size="lg" variant="light">
                                <IconPlus size={24} />
                            </Avatar>
                            <Text size="xs" lineClamp={1}>
                                {t('addStory')}
                            </Text>
                        </Stack>

                        <Stack align="center" gap={4} className="pointer" onClick={openFeedModal} miw={64}>
                            <Avatar radius="xl" size="lg" variant="light">
                                <IconPlus size={24} />
                            </Avatar>
                            <Text size="xs" lineClamp={1}>
                                {t('addFeed')}
                            </Text>
                        </Stack>

                        {userStoryGroups.map((group, gIdx) => {
                            const storyAuthor = group.author;
                            const storyImg =
                                formatImageSrc(group.newestStory?.photo) || formatImageSrc(storyAuthor?.profilePhoto);
                            return (
                                <Stack
                                    key={group.userId}
                                    ref={gIdx === userStoryGroups.length - 1 ? lastStoryElementRef : undefined}
                                    align="center"
                                    gap={4}
                                    className="pointer"
                                    miw={64}
                                    onClick={() => {
                                        setSelectedGroupIndex(gIdx);
                                        setStoryViewerOpened(true);
                                    }}
                                >
                                    <Avatar src={storyImg} radius={5} size="lg" className="story-avatar-border">
                                        ?
                                    </Avatar>
                                    <Text size="xs" lineClamp={1}>
                                        {storyAuthor
                                            ? `${storyAuthor.firstName ?? ''} ${storyAuthor.lastName ?? ''}`.trim() ||
                                              t('user')
                                            : t('user')}
                                    </Text>
                                </Stack>
                            );
                        })}

                        {isFetchingMoreStories && (
                            <Center px="md">
                                <Loader size="sm" />
                            </Center>
                        )}
                    </Group>
                </ScrollArea>
            </Card>

            <Stack gap="md">
                {feedsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} withBorder radius="md" p="md">
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
                        const isFeedOwner = currentUser?.id === feed.userId;
                        const commentsOpen = openCommentsFeedId === feed.id;
                        const reactionCounts: Record<number, number> = {};
                        feed.reactions?.forEach((r) => {
                            reactionCounts[r.reaction] = (reactionCounts[r.reaction] ?? 0) + 1;
                        });

                        const myReaction = feed.reactions?.find((r) => r.userId === currentUser?.id);

                        return (
                            <Card
                                key={feed.id}
                                withBorder
                                radius="md"
                                shadow="xs"
                                p="md"
                                ref={idx === feedsData.length - 1 ? lastFeedElementRef : undefined}
                            >
                                <Group justify="space-between" mb="xs">
                                    <Group gap="sm">
                                        <Avatar
                                            src={formatImageSrc(author?.profilePhoto)}
                                            radius="xl"
                                            component={Link}
                                            to={`/users/${author?.link ?? feed.userId}`}
                                        >
                                            ?
                                        </Avatar>
                                        <Box>
                                            <Text
                                                size="sm"
                                                fw={600}
                                                component={Link}
                                                to={`/users/${author?.link ?? feed.userId}`}
                                                className="no-decoration"
                                            >
                                                {author ? `${author.firstName} ${author.lastName}` : feed.userId}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {formatDateTime(feed.createdAt)}
                                            </Text>
                                        </Box>
                                    </Group>

                                    {isFeedOwner && (
                                        <Group gap="xs">
                                            <Tooltip label={t('editFeed')} withArrow>
                                                <ActionIcon
                                                    variant="light"
                                                    size={30}
                                                    onClick={() => handleOpenEditFeed(feed)}
                                                    aria-label={t('editFeed')}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label={t('delete')} withArrow>
                                                <ActionIcon
                                                    variant="light"
                                                    color="red"
                                                    size={30}
                                                    onClick={() => handleDeleteFeed(feed.id)}
                                                    loading={deleteFeedMutation.isPending}
                                                    disabled={deleteFeedMutation.isPending}
                                                    aria-label={t('delete')}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    )}
                                </Group>

                                {feed.feedOrigin && (
                                    <Badge variant="light" color="blue" size="sm" mb="xs">
                                        {formatFeedOrigin(feed.feedOrigin, t)}
                                    </Badge>
                                )}

                                {feed.text && (
                                    <Text size="sm" mb="sm" className="pre-wrap">
                                        {feed.text}
                                    </Text>
                                )}

                                {feed.photo && (
                                    <Image
                                        src={formatImageSrc(feed.photo)}
                                        alt={t('photo')}
                                        mah={400}
                                        fit="cover"
                                        radius={5}
                                        mb="sm"
                                    />
                                )}

                                <Group justify="space-between" mt="xs">
                                    <Group gap="xs">
                                        <Group gap={4} wrap="wrap">
                                            {FeedReactionEnum.ALL_REACTIONS.map((r) => {
                                                const count =
                                                    feed.reactions?.filter((rx) => rx.reaction === r.type).length ?? 0;
                                                const isMy = myReaction?.reaction === r.type;
                                                return (
                                                    <Button
                                                        key={r.type}
                                                        variant={isMy ? 'light' : 'subtle'}
                                                        color={isMy ? undefined : 'gray'}
                                                        size="xs"
                                                        px={6}
                                                        onClick={() => handleReaction(feed.id, r.type, myReaction)}
                                                        aria-label={t(`feedReactions.${r.key}`)}
                                                    >
                                                        <span className="reaction-item-emoji">{r.emoji}</span>
                                                        {count > 0 && (
                                                            <Text span size="xs" ml={4} fw={isMy ? 600 : 400}>
                                                                {count}
                                                            </Text>
                                                        )}
                                                    </Button>
                                                );
                                            })}
                                        </Group>

                                        <Button
                                            variant="subtle"
                                            size="xs"
                                            color="gray"
                                            leftSection={<IconMessageCircle size={16} />}
                                            onClick={() => setOpenCommentsFeedId(commentsOpen ? null : feed.id)}
                                        >
                                            {feed.comments?.length ?? 0}
                                        </Button>
                                    </Group>

                                    <EntityViewCounter
                                        entityId={feed.id}
                                        type={EntryTypeEnum.FEED}
                                        size={16}
                                        textSize="xs"
                                        track={true}
                                    />
                                </Group>

                                <Collapse expanded={commentsOpen}>
                                    <Stack gap="xs" mt="sm">
                                        {feed.comments?.map((c) => {
                                            const cAuthor =
                                                usersMap[c.userId] ??
                                                (currentUser?.id === c.userId ? currentUser : undefined);
                                            const canManageComment = currentUser?.id === c.userId;
                                            const isEditing = editingCommentId === c.id;

                                            return (
                                                <Paper key={c.id} p="xs" withBorder radius="sm">
                                                    <Group justify="space-between" mb={2}>
                                                        <Text size="xs" fw={600}>
                                                            {cAuthor
                                                                ? `${cAuthor.firstName ?? ''} ${cAuthor.lastName ?? ''}`.trim() ||
                                                                  c.userId
                                                                : c.userId}
                                                        </Text>
                                                        <Group gap={6}>
                                                            <Text size="xs" c="dimmed">
                                                                {formatDateTime(c.createdAt)}
                                                            </Text>
                                                            {canManageComment && !isEditing && (
                                                                <Group gap={4}>
                                                                    <Tooltip label={t('editComment')} withArrow>
                                                                        <ActionIcon
                                                                            size={30}
                                                                            variant="light"
                                                                            onClick={() => {
                                                                                setEditingCommentId(c.id);
                                                                                setEditingCommentText(c.text);
                                                                            }}
                                                                        >
                                                                            <IconEdit size={16} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                    <Tooltip label={t('deleteComment')} withArrow>
                                                                        <ActionIcon
                                                                            size={30}
                                                                            variant="light"
                                                                            color="red"
                                                                            onClick={() => handleDeleteComment(c.id)}
                                                                            loading={deleteCommentMutation.isPending}
                                                                            disabled={deleteCommentMutation.isPending}
                                                                            aria-label={t('deleteComment')}
                                                                        >
                                                                            <IconTrash size={16} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                </Group>
                                                            )}
                                                        </Group>
                                                    </Group>

                                                    {isEditing ? (
                                                        <Group gap="xs" mt={4}>
                                                            <TextInput
                                                                size="xs"
                                                                flex={1}
                                                                value={editingCommentText}
                                                                onChange={(e) =>
                                                                    setEditingCommentText(e.currentTarget.value)
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (
                                                                        e.key === 'Enter' &&
                                                                        editingCommentText.trim()
                                                                    ) {
                                                                        updateCommentMutation.mutate({
                                                                            id: c.id,
                                                                            text: editingCommentText.trim(),
                                                                        });
                                                                    } else if (e.key === 'Escape') {
                                                                        setEditingCommentId(null);
                                                                    }
                                                                }}
                                                                autoFocus
                                                            />
                                                            <Tooltip label={t('save')} withArrow>
                                                                <ActionIcon
                                                                    size={30}
                                                                    color="green"
                                                                    variant="light"
                                                                    onClick={() =>
                                                                        updateCommentMutation.mutate({
                                                                            id: c.id,
                                                                            text: editingCommentText.trim(),
                                                                        })
                                                                    }
                                                                    disabled={
                                                                        updateCommentMutation.isPending ||
                                                                        !editingCommentText.trim()
                                                                    }
                                                                    loading={updateCommentMutation.isPending}
                                                                >
                                                                    <IconCheck size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                            <Tooltip label={t('cancel')} withArrow>
                                                                <ActionIcon
                                                                    size={30}
                                                                    color="gray"
                                                                    variant="subtle"
                                                                    onClick={() => setEditingCommentId(null)}
                                                                >
                                                                    <IconX size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Group>
                                                    ) : (
                                                        <Text size="xs" className="pre-wrap">
                                                            {c.text}
                                                        </Text>
                                                    )}
                                                </Paper>
                                            );
                                        })}

                                        <Group gap="xs" mt="xs">
                                            <TextInput
                                                aria-label={t('writeComment')}
                                                placeholder={t('writeComment')}
                                                size="xs"
                                                flex={1}
                                                value={commentInputs[feed.id] ?? ''}
                                                onChange={(e) =>
                                                    setCommentInputs({
                                                        ...commentInputs,
                                                        [feed.id]: e.currentTarget.value,
                                                    })
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && (commentInputs[feed.id] ?? '').trim()) {
                                                        addCommentMutation.mutate({
                                                            feedId: feed.id,
                                                            text: commentInputs[feed.id].trim(),
                                                        });
                                                    }
                                                }}
                                            />
                                            <Button
                                                size="xs"
                                                loading={addCommentMutation.isPending}
                                                disabled={
                                                    addCommentMutation.isPending ||
                                                    !(commentInputs[feed.id] ?? '').trim()
                                                }
                                                onClick={() =>
                                                    addCommentMutation.mutate({
                                                        feedId: feed.id,
                                                        text: (commentInputs[feed.id] ?? '').trim(),
                                                    })
                                                }
                                            >
                                                {t('add')}
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Collapse>
                            </Card>
                        );
                    })
                )}

                {hasMoreFeeds && (
                    <Center my="md">
                        <Button variant="light" onClick={() => fetchNextFeedsPage()} loading={isFetchingMoreFeeds}>
                            {t('loadMore')}
                        </Button>
                    </Center>
                )}
            </Stack>

            <StoryViewerModal
                opened={storyViewerOpened}
                onClose={() => setStoryViewerOpened(false)}
                groups={userStoryGroups}
                initialGroupIndex={selectedGroupIndex}
                onEdit={handleOpenEditStory}
                onDelete={handleDeleteStory}
                updatedStory={updatedStoryForModal}
            />

            <Modal opened={storyOpened} onClose={closeStoryModal} title={t('addStory')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        value={storyText}
                        error={storyFieldErrors.text}
                        onChange={(e) => setStoryText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhoto')}
                        accept="image/*"
                        value={storyPhoto}
                        error={storyFieldErrors.photo}
                        onChange={setStoryPhoto}
                        clearable
                        required
                    />
                    <Button
                        mt="md"
                        loading={createStoryMutation.isPending}
                        disabled={createStoryMutation.isPending || !storyText.trim() || !storyPhoto}
                        onClick={() => createStoryMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            <Modal
                opened={editStoryOpened}
                onClose={closeEditStoryModal}
                title={t('editStory')}
                size="lg"
                zIndex={1000}
            >
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        value={editStoryText}
                        error={editStoryFieldErrors.text}
                        onChange={(e) => setEditStoryText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhoto')}
                        description={t('leaveEmptyToKeep')}
                        accept="image/*"
                        leftSection={<IconPhoto size={16} />}
                        value={editStoryPhoto}
                        error={editStoryFieldErrors.photo}
                        onChange={setEditStoryPhoto}
                        clearable
                    />
                    <Button
                        mt="md"
                        loading={updateStoryMutation.isPending}
                        disabled={updateStoryMutation.isPending || !editStoryText.trim()}
                        onClick={() => updateStoryMutation.mutate()}
                    >
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>

            <Modal opened={feedOpened} onClose={closeFeedModal} title={t('addFeed')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        required
                        autosize
                        minRows={2}
                        value={feedText}
                        error={feedFieldErrors.text}
                        onChange={(e) => {
                            setFeedText(e.currentTarget.value);
                            if (feedFieldErrors.text) setFeedFieldErrors({ ...feedFieldErrors, text: '' });
                        }}
                    />

                    <FileInput
                        label={t('photo')}
                        required
                        leftSection={<IconPhoto size={16} />}
                        placeholder={t('selectPhoto')}
                        accept="image/*"
                        value={feedPhoto}
                        error={feedFieldErrors.photo}
                        onChange={setFeedPhoto}
                        clearable
                    />

                    <Button
                        mt="md"
                        loading={createFeedMutation.isPending}
                        disabled={createFeedMutation.isPending || !feedText.trim() || !feedPhoto}
                        onClick={() => createFeedMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            <Modal opened={editFeedOpened} onClose={closeEditFeedModal} title={t('editFeed')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        required
                        autosize
                        minRows={2}
                        value={editFeedText}
                        error={editFeedFieldErrors.text}
                        onChange={(e) => {
                            setEditFeedText(e.currentTarget.value);
                            if (editFeedFieldErrors.text) setEditFeedFieldErrors({ ...editFeedFieldErrors, text: '' });
                        }}
                    />

                    <FileInput
                        label={t('photo')}
                        leftSection={<IconPhoto size={16} />}
                        placeholder={t('selectPhoto')}
                        description={t('leaveEmptyToKeep')}
                        accept="image/*"
                        value={editFeedPhoto}
                        error={editFeedFieldErrors.photo}
                        onChange={setEditFeedPhoto}
                        clearable
                    />

                    <Button
                        mt="md"
                        loading={updateFeedMutation.isPending}
                        disabled={updateFeedMutation.isPending || !editFeedText.trim()}
                        onClick={() => updateFeedMutation.mutate()}
                    >
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
