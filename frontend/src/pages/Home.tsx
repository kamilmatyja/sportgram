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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconHeart, IconMessageCircle, IconTrash, IconPhoto } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { feedService, storyService, userService, type UserResource } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { FeedReactionEnum } from '../enums/FeedReactionEnum';
import { RunnerLogo } from '../components/RunnerLogo';
import { fileToBase64, formatImageSrc } from '../utils/imageUtils';

export default function Home() {
    const { t } = useTranslation();
    const { isAuthenticated, currentUser, isAdmin } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Stories modal
    const [storyOpened, { open: openStoryModal, close: closeStoryModal }] = useDisclosure(false);
    const [storyText, setStoryText] = useState('');
    const [storyPhoto, setStoryPhoto] = useState<File | null>(null);

    // New feed input
    const [feedText, setFeedText] = useState('');
    const [feedPhoto, setFeedPhoto] = useState<File | null>(null);

    // Active comments collapse for feeds
    const [openCommentsFeedId, setOpenCommentsFeedId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    // Fetch feeds
    const { data: feedsData, isLoading: feedsLoading } = useQuery({
        queryKey: ['feeds'],
        queryFn: async () => {
            const res = await feedService.getFeeds({ page: 1, limit: 30, sort: 'createdAt:desc' });
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

    // Collect user IDs from feeds and stories
    const relatedUserIds = useMemo(() => {
        const ids: string[] = [];
        feedsData?.forEach((f) => {
            ids.push(f.userId);
            f.comments?.forEach((c) => ids.push(c.userId));
        });
        storiesData?.forEach((s) => ids.push(s.userId));
        return Array.from(new Set(ids));
    }, [feedsData, storiesData]);

    // Fetch related users
    const { data: usersMapData } = useQuery({
        queryKey: ['feed-users', relatedUserIds],
        queryFn: async () => {
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

    const usersMap = usersMapData ?? {};

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
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedAdded'), color: 'green' });
        },
        onError: (err) => {
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
            closeStoryModal();
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyAdded'), color: 'green' });
        },
        onError: (err) => {
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
            notifications.show({ title: t('feeds'), message: t('feedDeleted'), color: 'blue' });
        },
    });

    // Add reaction
    const addReactionMutation = useMutation({
        mutationFn: async ({ feedId, type }: { feedId: string; type: number }) => {
            await feedService.addReaction(feedId, type);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
        },
    });

    // Add comment
    const addCommentMutation = useMutation({
        mutationFn: async ({ feedId, text }: { feedId: string; text: string }) => {
            await feedService.addComment(feedId, text);
        },
        onSuccess: () => {
            setCommentText('');
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('comments'), message: t('commentAdded'), color: 'green' });
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
            <Card withBorder radius="md" p="sm" shadow="xs">
                <ScrollArea type="never">
                    <Group gap="md" wrap="nowrap">
                        {/* Add Story Button */}
                        <Stack align="center" gap={4} className="pointer" onClick={openStoryModal}>
                            <Avatar radius="xl" size="lg" color="blue">
                                <IconPlus size={24} />
                            </Avatar>
                            <Text size="xs" fw={500}>
                                {t('addStory')}
                            </Text>
                        </Stack>

                        {/* List of active stories */}
                        {storiesData?.map((story) => {
                            const storyAuthor = usersMap[story.userId];
                            const storyImg = formatImageSrc(story.photo) || formatImageSrc(storyAuthor?.profilePhoto);
                            return (
                                <Stack
                                    key={story.id}
                                    align="center"
                                    gap={4}
                                    className="pointer"
                                    miw={64}
                                    onClick={() => {
                                        notifications.show({
                                            title: storyAuthor?.firstName ?? t('stories'),
                                            message: story.text || '',
                                            color: 'blue',
                                        });
                                    }}
                                >
                                    <Avatar src={storyImg} radius="xl" size="lg" className="story-avatar-border">
                                        ?
                                    </Avatar>
                                    <Text size="xs" lineClamp={1}>
                                        {storyAuthor?.firstName ?? t('user')}
                                    </Text>
                                </Stack>
                            );
                        })}
                    </Group>
                </ScrollArea>
            </Card>

            {/* Add new Feed box */}
            <Paper withBorder radius="md" p="md" shadow="xs">
                <Stack gap="sm">
                    <Textarea
                        label={t('feeds')}
                        required
                        placeholder={t('whatIsOnYourMind')}
                        autosize
                        minRows={2}
                        value={feedText}
                        onChange={(e) => setFeedText(e.currentTarget.value)}
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
                            disabled={!feedText.trim() || !feedPhoto}
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
                    <Text ta="center" c="dimmed">
                        {t('loadingFeeds')}
                    </Text>
                ) : feedsData?.length === 0 ? (
                    <Paper withBorder p="xl" radius="md" ta="center">
                        <Text c="dimmed">{t('noMoreFeeds')}</Text>
                    </Paper>
                ) : (
                    feedsData?.map((feed) => {
                        const author = usersMap[feed.userId];
                        const isOwner = currentUser?.id === feed.userId || isAdmin;
                        const commentsOpen = openCommentsFeedId === feed.id;

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
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="sm"
                                            onClick={() => deleteFeedMutation.mutate(feed.id)}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
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
                                        <Button
                                            variant="subtle"
                                            size="xs"
                                            color="red"
                                            leftSection={<IconHeart size={16} />}
                                            onClick={() =>
                                                addReactionMutation.mutate({
                                                    feedId: feed.id,
                                                    type: FeedReactionEnum.LIKE,
                                                })
                                            }
                                        >
                                            {feed.reactions?.length ?? 0}
                                        </Button>

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
                                            const cAuthor = usersMap[c.userId];
                                            return (
                                                <Paper key={c.id} p="xs" withBorder radius="sm">
                                                    <Group justify="space-between" mb={2}>
                                                        <Text size="xs" fw={600}>
                                                            {cAuthor
                                                                ? `${cAuthor.firstName} ${cAuthor.lastName}`
                                                                : c.userId}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            {c.createdAt
                                                                ? new Date(c.createdAt).toLocaleTimeString()
                                                                : ''}
                                                        </Text>
                                                    </Group>
                                                    <Text size="xs">{c.text}</Text>
                                                </Paper>
                                            );
                                        })}

                                        <Group gap="xs" mt="xs">
                                            <TextInput
                                                placeholder={t('writeComment')}
                                                size="xs"
                                                flex={1}
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.currentTarget.value)}
                                            />
                                            <Button
                                                size="xs"
                                                loading={addCommentMutation.isPending}
                                                disabled={!commentText.trim()}
                                                onClick={() =>
                                                    addCommentMutation.mutate({ feedId: feed.id, text: commentText })
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

            {/* Story Creation Modal */}
            <Modal opened={storyOpened} onClose={closeStoryModal} title={t('addStory')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        placeholder={t('storyDescriptionPlaceholder')}
                        value={storyText}
                        onChange={(e) => setStoryText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        accept="image/*"
                        value={storyPhoto}
                        onChange={setStoryPhoto}
                        clearable
                        required
                    />
                    <Button
                        mt="md"
                        loading={createStoryMutation.isPending}
                        disabled={!storyText.trim() || !storyPhoto}
                        onClick={() => createStoryMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
