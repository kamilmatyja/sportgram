import { useState, useMemo } from 'react';
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
    Menu,
    Tooltip,
    Skeleton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconMessageCircle, IconTrash, IconPhoto, IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../api/client';
import {
    feedService,
    storyService,
    userService,
    type StoryResource,
    type UserResource,
    type FeedReactionResource,
} from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { StoryViewerModal, type UserStoriesGroup } from '../components/StoryViewerModal';
import { RunnerLogo } from '../components/RunnerLogo';
import { EmptyState } from '../components/EmptyState';
import { openConfirmActionModal } from '../utils/confirmModal';
import { FeedReactionEnum } from '../enums/FeedReactionEnum';
import { fileToBase64, formatImageSrc } from '../utils/imageUtils';

export default function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated, currentUser, isAdmin } = useAuth();

    // Story creation modal
    const [storyOpened, { open: openStoryModal, close: closeStoryModal }] = useDisclosure(false);
    const [storyText, setStoryText] = useState('');
    const [storyPhoto, setStoryPhoto] = useState<File | null>(null);

    // Active story viewer
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
    const [storyViewerOpened, setStoryViewerOpened] = useState(false);

    // New feed input
    const [feedText, setFeedText] = useState('');
    const [feedPhoto, setFeedPhoto] = useState<File | null>(null);
    const [feedFieldErrors, setFeedFieldErrors] = useState<Record<string, string>>({});
    const [storyFieldErrors, setStoryFieldErrors] = useState<Record<string, string>>({});

    // Active comments collapse for feeds
    const [openCommentsFeedId, setOpenCommentsFeedId] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

    // Comment editing state
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    // Fetch feeds with comments and reactions included
    const { data: feedsData, isLoading: feedsLoading } = useQuery({
        queryKey: ['feeds'],
        queryFn: async () => {
            const res = await feedService.getFeeds({
                page: 1,
                limit: 30,
                sort: 'createdAt:desc',
                'include[]': ['feedComments', 'feedReactions'],
            });
            return res.data ?? [];
        },
        enabled: isAuthenticated,
    });

    // Fetch stories
    const { data: storiesData } = useQuery({
        queryKey: ['stories'],
        queryFn: async () => {
            const res = await storyService.getStories({ page: 1, limit: 20, sort: 'createdAt:desc' });
            return res.data ?? [];
        },
        enabled: isAuthenticated,
    });

    // Collect user IDs from feeds, comments, reactions and stories
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

    // Fetch related users
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

    // Add feed mutation
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
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedAdded'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFeedFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Add story mutation
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

    // Delete feed mutation
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

    // Add reaction mutation
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

    // Update reaction mutation
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

    // Delete reaction mutation
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

    // Handle reaction click (create / update / delete)
    const handleReaction = (feedId: string, type: number, myReaction?: FeedReactionResource) => {
        if (!myReaction) {
            addReactionMutation.mutate({ feedId, type });
        } else if (myReaction.reaction === type) {
            deleteReactionMutation.mutate(myReaction.id);
        } else {
            updateReactionMutation.mutate({ reactionId: myReaction.id, type });
        }
    };

    // Add comment
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

    // Update comment
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

    // Delete comment
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

    // Guest view
    if (!isAuthenticated) {
        return (
            <Stack align="center" justify="center" py={60}>
                <Paper withBorder p={40} radius="lg" shadow="md" maw={520} ta="center" mx="auto">
                    <Box mb="md">
                        <RunnerLogo size={64} />
                    </Box>
                    <Title order={1} mb="sm">
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
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Stories horizontal carousel */}
            <Card withBorder radius="md" p="md" shadow="xs">
                <ScrollArea type="never" offsetScrollbars>
                    <Group gap="md" wrap="nowrap">
                        {/* Add Story Button */}
                        <Stack align="center" gap={4} className="pointer" onClick={openStoryModal} miw={64}>
                            <Avatar radius="xl" size="lg" color="blue" variant="light">
                                <IconPlus size={24} />
                            </Avatar>
                            <Text size="xs" lineClamp={1}>
                                {t('addStory')}
                            </Text>
                        </Stack>

                        {/* List of active stories grouped per person */}
                        {userStoryGroups.map((group, gIdx) => {
                            const storyAuthor = group.author;
                            const storyImg =
                                formatImageSrc(group.newestStory?.photo) || formatImageSrc(storyAuthor?.profilePhoto);
                            return (
                                <Stack
                                    key={group.userId}
                                    align="center"
                                    gap={4}
                                    className="pointer"
                                    miw={64}
                                    onClick={() => {
                                        setSelectedGroupIndex(gIdx);
                                        setStoryViewerOpened(true);
                                    }}
                                >
                                    <Avatar src={storyImg} radius="xl" size="lg" className="story-avatar-border">
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
                    </Group>
                </ScrollArea>
            </Card>

            {/* Create Feed Card */}
            <Paper withBorder p="md" radius="md" shadow="xs">
                <Stack gap="sm">
                    <Textarea
                        label={t('feeds')}
                        required
                        placeholder={t('whatIsOnYourMind')}
                        autosize
                        minRows={2}
                        value={feedText}
                        error={feedFieldErrors.text}
                        onChange={(e) => {
                            setFeedText(e.currentTarget.value);
                            if (feedFieldErrors.text) setFeedFieldErrors({ ...feedFieldErrors, text: '' });
                        }}
                    />

                    <Group justify="space-between" align="flex-end">
                        <FileInput
                            label={t('photo')}
                            required
                            leftSection={<IconPhoto size={16} />}
                            placeholder={t('selectPhoto')}
                            accept="image/*"
                            size="xs"
                            value={feedPhoto}
                            onChange={setFeedPhoto}
                            clearable
                            maw={200}
                        />

                        <Button
                            size="xs"
                            loading={createFeedMutation.isPending}
                            disabled={createFeedMutation.isPending || !feedText.trim() || !feedPhoto}
                            onClick={() => createFeedMutation.mutate()}
                        >
                            {t('send')}
                        </Button>
                    </Group>
                </Stack>
            </Paper>

            {/* Feeds stream */}
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
                    <EmptyState title={t('noMoreFeeds')} />
                ) : (
                    feedsData?.map((feed) => {
                        const author =
                            usersMap[feed.userId] ?? (currentUser?.id === feed.userId ? currentUser : undefined);
                        const isOwner = currentUser?.id === feed.userId || isAdmin;
                        const commentsOpen = openCommentsFeedId === feed.id;

                        // Reaction counts
                        const reactionCounts: Record<number, number> = {};
                        feed.reactions?.forEach((r) => {
                            reactionCounts[r.reaction] = (reactionCounts[r.reaction] ?? 0) + 1;
                        });

                        const myReaction = feed.reactions?.find((r) => r.userId === currentUser?.id);

                        return (
                            <Card key={feed.id} withBorder radius="md" shadow="xs" p="md">
                                {/* Header */}
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
                                                {feed.createdAt ? new Date(feed.createdAt).toLocaleString() : ''}
                                            </Text>
                                        </Box>
                                    </Group>

                                    {isOwner && (
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
                                    )}
                                </Group>

                                {/* Content */}
                                <Text size="sm" mb="sm" className="pre-wrap">
                                    {feed.text}
                                </Text>

                                {feed.photo && (
                                    <Image
                                        src={formatImageSrc(feed.photo)}
                                        alt={t('photo')}
                                        mah={400}
                                        fit="cover"
                                        radius="md"
                                        mb="sm"
                                    />
                                )}

                                {/* Actions & stats */}
                                <Group justify="space-between" mt="xs">
                                    <Group gap="xs">
                                        {/* Reaction Picker Menu */}
                                        <Menu shadow="md" position="top-start" withArrow width="max-content">
                                            <Menu.Target>
                                                <Button
                                                    variant="subtle"
                                                    size="xs"
                                                    color={myReaction ? undefined : 'gray'}
                                                    leftSection={
                                                        <span className="reaction-target-emoji">
                                                            {myReaction
                                                                ? FeedReactionEnum.getEmoji(myReaction.reaction)
                                                                : '👍'}
                                                        </span>
                                                    }
                                                >
                                                    {feed.reactions?.length ?? 0}
                                                </Button>
                                            </Menu.Target>
                                            <Menu.Dropdown className="reaction-menu-dropdown">
                                                <Group className="reaction-menu-group">
                                                    {FeedReactionEnum.ALL_REACTIONS.map((r) => (
                                                        <ActionIcon
                                                            key={r.type}
                                                            variant={
                                                                myReaction?.reaction === r.type ? 'filled' : 'subtle'
                                                            }
                                                            color={myReaction?.reaction === r.type ? undefined : 'gray'}
                                                            size={30}
                                                            className="reaction-action-icon"
                                                            onClick={() => handleReaction(feed.id, r.type, myReaction)}
                                                            title={t(`feedReactions.${r.key}`)}
                                                        >
                                                            <span className="reaction-item-emoji">{r.emoji}</span>
                                                        </ActionIcon>
                                                    ))}
                                                </Group>
                                            </Menu.Dropdown>
                                        </Menu>

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
                                </Group>

                                {/* Comments section */}
                                <Collapse expanded={commentsOpen}>
                                    <Stack gap="xs" mt="sm">
                                        {feed.comments?.map((c) => {
                                            const cAuthor =
                                                usersMap[c.userId] ??
                                                (currentUser?.id === c.userId ? currentUser : undefined);
                                            const canManageComment = currentUser?.id === c.userId || isAdmin;
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
                                                                {c.createdAt
                                                                    ? new Date(c.createdAt).toLocaleTimeString()
                                                                    : ''}
                                                            </Text>
                                                            {canManageComment && !isEditing && (
                                                                <Group gap={4}>
                                                                    <Tooltip label={t('editComment')} withArrow>
                                                                        <ActionIcon
                                                                            size={30}
                                                                            variant="light"
                                                                            color="blue"
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
                                                {t('send')}
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Collapse>
                            </Card>
                        );
                    })
                )}
            </Stack>

            {/* Story Viewer Modal */}
            <StoryViewerModal
                opened={storyViewerOpened}
                onClose={() => setStoryViewerOpened(false)}
                groups={userStoryGroups}
                initialGroupIndex={selectedGroupIndex}
            />

            {/* Story Creation Modal */}
            <Modal opened={storyOpened} onClose={closeStoryModal} title={t('addStory')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        placeholder={t('storyDescriptionPlaceholder')}
                        value={storyText}
                        error={storyFieldErrors.text}
                        onChange={(e) => setStoryText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
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
        </Stack>
    );
}
