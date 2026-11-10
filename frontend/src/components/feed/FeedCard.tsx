import { useState } from 'react';
import {
    Card,
    Group,
    Avatar,
    Box,
    Text,
    Badge,
    Image,
    Button,
    Collapse,
    Stack,
    Paper,
    TextInput,
    ActionIcon,
    Tooltip,
    Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMessageCircle, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { feedService, type FeedResource, type UserResource, type FeedReactionResource } from '../../api/services';
import { useAuth } from '../../auth';
import { EntityViewCounter } from '../EntityViewCounter';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { openConfirmActionModal } from '../../utils';
import { formatDateTime } from '../../utils';
import { formatImageSrc } from '../../utils';
import { formatFeedOrigin } from '../../utils';

export interface FeedCardProps {
    feed: FeedResource;
    author?: UserResource | null;
    usersMap?: Record<string, UserResource>;
    onEditFeed?: (feed: FeedResource) => void;
    onDeleteFeed?: (id: string) => void;
    domRef?: (node: HTMLElement | null) => void;
}

export function FeedCard({ feed, author, usersMap = {}, onEditFeed, onDeleteFeed, domRef }: FeedCardProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    const isFeedOwner = currentUser?.id === feed.userId;
    const myReaction = feed.reactions?.find((r) => r.userId === currentUser?.id);

    const invalidateFeeds = () => {
        void queryClient.invalidateQueries({ queryKey: ['feeds'] });
        void queryClient.invalidateQueries({ queryKey: ['user-feeds'] });
        void queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
    };

    const addReactionMutation = useMutation({
        mutationFn: async ({ feedId, type }: { feedId: string; type: number }) => {
            await feedService.createFeedReaction({
                params: { path: { id: feedId } },
                body: { type: type as 1 | 2 | 3 | 4 | 5 | 6 },
            });
        },
        onSuccess: () => {
            invalidateFeeds();
            notifications.show({ title: t('reactions'), message: t('created'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateReactionMutation = useMutation({
        mutationFn: async ({ reactionId, type }: { reactionId: string; type: number }) => {
            await feedService.updateFeedReaction({
                params: { path: { id: reactionId } },
                body: { type: type as 1 | 2 | 3 | 4 | 5 | 6 },
            });
        },
        onSuccess: () => {
            invalidateFeeds();
            notifications.show({ title: t('reactions'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteReactionMutation = useMutation({
        mutationFn: async (reactionId: string) => {
            await feedService.deleteFeedReaction({
                params: { path: { id: reactionId } },
            });
        },
        onSuccess: () => {
            invalidateFeeds();
            notifications.show({ title: t('reactions'), message: t('deleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleReaction = (type: number, currentReaction?: FeedReactionResource) => {
        if (!currentReaction) {
            addReactionMutation.mutate({ feedId: feed.id, type });
        } else if (currentReaction.reaction === type) {
            deleteReactionMutation.mutate(currentReaction.id);
        } else {
            updateReactionMutation.mutate({ reactionId: currentReaction.id, type });
        }
    };

    const addCommentMutation = useMutation({
        mutationFn: async (text: string) => {
            await feedService.createFeedComment({
                params: { path: { id: feed.id } },
                body: { text },
            });
        },
        onSuccess: () => {
            setCommentInput('');
            invalidateFeeds();
            notifications.show({ title: t('comments'), message: t('created'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateCommentMutation = useMutation({
        mutationFn: async ({ id, text }: { id: string; text: string }) => {
            await feedService.updateFeedComment({
                params: { path: { id } },
                body: { text },
            });
        },
        onSuccess: () => {
            setEditingCommentId(null);
            setEditingCommentText('');
            invalidateFeeds();
            notifications.show({ title: t('comments'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteCommentMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteFeedComment({
                params: { path: { id } },
            });
        },
        onSuccess: () => {
            invalidateFeeds();
            notifications.show({ title: t('comments'), message: t('deleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDeleteComment = (id: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteCommentMutation.mutate(id),
        });
    };

    const feedAuthor = author ?? usersMap[feed.userId];
    const authorLink = feedAuthor?.link ? `/users/${feedAuthor.link}` : `/users/${feed.userId}`;
    const authorName = feedAuthor
        ? `${feedAuthor.firstName ?? ''} ${feedAuthor.lastName ?? ''}`.trim() || feedAuthor.link || feed.userId
        : feed.userId;

    return (
        <Card ref={domRef}>
            <Group justify="space-between" mb="xs">
                <Group>
                    <Avatar src={formatImageSrc(feedAuthor?.profilePhoto)} component={Link} to={authorLink}>
                        ?
                    </Avatar>
                    <Box>
                        <Anchor size="sm" fw={600} component={Link} to={authorLink} c="inherit" underline="hover">
                            {authorName}
                        </Anchor>
                        <Text size="sm" c="dimmed">
                            {formatDateTime(feed.createdAt)}
                        </Text>
                    </Box>
                </Group>

                {isFeedOwner && (
                    <Group gap="xs">
                        {onEditFeed && (
                            <Tooltip label={t('edit')}>
                                <ActionIcon onClick={() => onEditFeed(feed)} aria-label={t('edit')}>
                                    <IconEdit size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {onDeleteFeed && (
                            <Tooltip label={t('delete')}>
                                <ActionIcon color="red" onClick={() => onDeleteFeed(feed.id)} aria-label={t('delete')}>
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                )}
            </Group>

            {feed.feedOrigin && (
                <Badge color="blue" mb="xs">
                    {formatFeedOrigin(feed.feedOrigin, t)}
                </Badge>
            )}

            {feed.text && (
                <Text size="sm" mb="sm" className="pre-wrap">
                    {feed.text}
                </Text>
            )}

            {feed.photo && <Image src={formatImageSrc(feed.photo)} alt={t('photo')} mah={400} mb="sm" />}

            <Group justify="space-between" mt="xs">
                <Group gap="xs">
                    <Group gap={4} wrap="wrap">
                        {FeedReactionEnum.ALL_REACTIONS.map((r) => {
                            const count = feed.reactions?.filter((rx) => rx.reaction === r.type).length ?? 0;
                            const isMy = myReaction?.reaction === r.type;
                            return (
                                <Button
                                    key={r.type}
                                    variant={isMy ? 'light' : 'subtle'}
                                    color={isMy ? undefined : 'gray'}
                                    size="xs"
                                    px={6}
                                    onClick={() => handleReaction(r.type, myReaction)}
                                    aria-label={t(`feedReactions.${r.key}`)}
                                >
                                    <Text span fz={16} lh={1}>
                                        {r.emoji}
                                    </Text>
                                    {count > 0 && (
                                        <Text span size="xs" ml={4} fw={600}>
                                            {count}
                                        </Text>
                                    )}
                                </Button>
                            );
                        })}
                    </Group>

                    <Button
                        variant="default"
                        size="xs"
                        leftSection={<IconMessageCircle size={16} />}
                        onClick={() => setCommentsOpen(!commentsOpen)}
                    >
                        {feed.comments?.length ?? 0}
                    </Button>
                </Group>

                <EntityViewCounter entityId={feed.id} type={EntryTypeEnum.FEED} textSize="xs" />
            </Group>

            <Collapse expanded={commentsOpen}>
                <Stack gap="xs" mt="sm">
                    {feed.comments?.map((c) => {
                        const cAuthor =
                            usersMap[c.userId] ??
                            (currentUser?.id === c.userId ? currentUser : undefined) ??
                            (feedAuthor?.id === c.userId ? feedAuthor : undefined);
                        const cAuthorName = cAuthor
                            ? `${cAuthor.firstName ?? ''} ${cAuthor.lastName ?? ''}`.trim() || cAuthor.link || c.userId
                            : c.userId;
                        const cAuthorPhoto = formatImageSrc(cAuthor?.profilePhoto);
                        const canManageComment = currentUser?.id === c.userId;
                        const isEditing = editingCommentId === c.id;

                        return (
                            <Paper key={c.id} p="xs">
                                <Group justify="space-between" align="center" wrap="nowrap" mb="xs">
                                    <Group wrap="nowrap">
                                        {cAuthor?.link ? (
                                            <Avatar src={cAuthorPhoto} component={Link} to={`/users/${cAuthor.link}`}>
                                                ?
                                            </Avatar>
                                        ) : (
                                            <Avatar src={cAuthorPhoto}>?</Avatar>
                                        )}
                                        <Box>
                                            {cAuthor?.link ? (
                                                <Anchor
                                                    size="sm"
                                                    fw={600}
                                                    component={Link}
                                                    to={`/users/${cAuthor.link}`}
                                                    c="inherit"
                                                    underline="hover"
                                                >
                                                    {cAuthorName}
                                                </Anchor>
                                            ) : (
                                                <Text size="sm" fw={600}>
                                                    {cAuthorName}
                                                </Text>
                                            )}
                                            <Text size="sm" c="dimmed">
                                                {formatDateTime(c.createdAt)}
                                            </Text>
                                        </Box>
                                    </Group>

                                    {canManageComment && !isEditing && (
                                        <Group gap={4} wrap="nowrap">
                                            <Tooltip label={t('edit')}>
                                                <ActionIcon
                                                    onClick={() => {
                                                        setEditingCommentId(c.id);
                                                        setEditingCommentText(c.text);
                                                    }}
                                                    aria-label={t('edit')}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label={t('delete')}>
                                                <ActionIcon
                                                    color="red"
                                                    onClick={() => handleDeleteComment(c.id)}
                                                    loading={deleteCommentMutation.isPending}
                                                    disabled={deleteCommentMutation.isPending}
                                                    aria-label={t('delete')}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    )}
                                </Group>

                                {isEditing ? (
                                    <Group gap="xs" mt={4}>
                                        <TextInput
                                            size="xs"
                                            flex={1}
                                            value={editingCommentText}
                                            onChange={(e) => setEditingCommentText(e.currentTarget.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && editingCommentText.trim()) {
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
                                        <Tooltip label={t('save')}>
                                            <ActionIcon
                                                color="green"
                                                onClick={() =>
                                                    updateCommentMutation.mutate({
                                                        id: c.id,
                                                        text: editingCommentText.trim(),
                                                    })
                                                }
                                                disabled={updateCommentMutation.isPending || !editingCommentText.trim()}
                                                loading={updateCommentMutation.isPending}
                                                aria-label={t('save')}
                                            >
                                                <IconCheck size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label={t('cancel')}>
                                            <ActionIcon
                                                color="gray"
                                                variant="subtle"
                                                onClick={() => setEditingCommentId(null)}
                                                aria-label={t('cancel')}
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
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && commentInput.trim()) {
                                    addCommentMutation.mutate(commentInput.trim());
                                }
                            }}
                        />
                        <Button
                            size="xs"
                            onClick={() => {
                                if (commentInput.trim()) {
                                    addCommentMutation.mutate(commentInput.trim());
                                }
                            }}
                            loading={addCommentMutation.isPending}
                            disabled={!commentInput.trim() || addCommentMutation.isPending}
                        >
                            {t('save')}
                        </Button>
                    </Group>
                </Stack>
            </Collapse>
        </Card>
    );
}
