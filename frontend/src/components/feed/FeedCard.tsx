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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMessageCircle, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { feedService, type FeedResource, type UserResource, type FeedReactionResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { EntityViewCounter } from '../EntityViewCounter';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { formatImageSrc } from '../../utils/imageUtils';
import { formatFeedOrigin } from '../../utils/text';

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
        queryClient.invalidateQueries({ queryKey: ['feeds'] });
        queryClient.invalidateQueries({ queryKey: ['user-feeds'] });
        queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
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
            notifications.show({ title: t('reactions'), message: t('reactionAdded'), color: 'green' });
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
            notifications.show({ title: t('reactions'), message: t('reactionUpdated'), color: 'green' });
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
            notifications.show({ title: t('reactions'), message: t('reactionDeleted'), color: 'green' });
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
            notifications.show({ title: t('comments'), message: t('commentAdded'), color: 'green' });
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
            notifications.show({ title: t('comments'), message: t('commentUpdated'), color: 'green' });
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
            notifications.show({ title: t('comments'), message: t('commentDeleted'), color: 'green' });
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

    const authorLink = author?.link ? `/users/${author.link}` : `/users/${feed.userId}`;
    const authorName = author ? `${author.firstName} ${author.lastName}` : feed.userId;

    return (
        <Card withBorder radius="md" shadow="xs" p="md" ref={domRef}>
            <Group justify="space-between" mb="xs">
                <Group gap="sm">
                    <Avatar src={formatImageSrc(author?.profilePhoto)} radius={5} component={Link} to={authorLink}>
                        ?
                    </Avatar>
                    <Box>
                        <Text size="sm" fw={600} component={Link} to={authorLink} className="no-decoration">
                            {authorName}
                        </Text>
                        <Text size="sm" c="dimmed">
                            {formatDateTime(feed.createdAt)}
                        </Text>
                    </Box>
                </Group>

                {isFeedOwner && (
                    <Group gap="xs">
                        {onEditFeed && (
                            <Tooltip label={t('editFeed')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    size={30}
                                    onClick={() => onEditFeed(feed)}
                                    aria-label={t('editFeed')}
                                >
                                    <IconEdit size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {onDeleteFeed && (
                            <Tooltip label={t('delete')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size={30}
                                    onClick={() => onDeleteFeed(feed.id)}
                                    aria-label={t('delete')}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
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
                <Image src={formatImageSrc(feed.photo)} alt={t('photo')} mah={400} fit="cover" radius={5} mb="sm" />
            )}

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
                        onClick={() => setCommentsOpen(!commentsOpen)}
                    >
                        {feed.comments?.length ?? 0}
                    </Button>
                </Group>

                <EntityViewCounter entityId={feed.id} type={EntryTypeEnum.FEED} size={16} textSize="xs" track={true} />
            </Group>

            <Collapse expanded={commentsOpen}>
                <Stack gap="xs" mt="sm">
                    {feed.comments?.map((c) => {
                        const cAuthor = usersMap[c.userId] ?? (currentUser?.id === c.userId ? currentUser : undefined);
                        const cAuthorName = cAuthor
                            ? `${cAuthor.firstName ?? ''} ${cAuthor.lastName ?? ''}`.trim() || cAuthor.link || c.userId
                            : c.userId;
                        const cAuthorPhoto = formatImageSrc(cAuthor?.profilePhoto);
                        const canManageComment = currentUser?.id === c.userId;
                        const isEditing = editingCommentId === c.id;

                        return (
                            <Paper key={c.id} p="xs" withBorder radius="sm">
                                <Group justify="space-between" align="center" wrap="nowrap" mb="xs">
                                    <Group gap="sm" wrap="nowrap">
                                        {cAuthor?.link ? (
                                            <Avatar
                                                src={cAuthorPhoto}
                                                radius={5}
                                                component={Link}
                                                to={`/users/${cAuthor.link}`}
                                            >
                                                ?
                                            </Avatar>
                                        ) : (
                                            <Avatar src={cAuthorPhoto} radius={5}>
                                                ?
                                            </Avatar>
                                        )}
                                        <Box>
                                            {cAuthor?.link ? (
                                                <Text
                                                    size="sm"
                                                    fw={600}
                                                    component={Link}
                                                    to={`/users/${cAuthor.link}`}
                                                    className="no-decoration"
                                                >
                                                    {cAuthorName}
                                                </Text>
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
                                            <Tooltip label={t('editComment')} withArrow>
                                                <ActionIcon
                                                    size={30}
                                                    variant="light"
                                                    onClick={() => {
                                                        setEditingCommentId(c.id);
                                                        setEditingCommentText(c.text);
                                                    }}
                                                    aria-label={t('editComment')}
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
                                                disabled={updateCommentMutation.isPending || !editingCommentText.trim()}
                                                loading={updateCommentMutation.isPending}
                                                aria-label={t('save')}
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
                            {t('comment')}
                        </Button>
                    </Group>
                </Stack>
            </Collapse>
        </Card>
    );
}
