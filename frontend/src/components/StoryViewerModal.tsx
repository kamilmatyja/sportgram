import { useEffect, useState, useCallback, useRef } from 'react';
import { Modal, Stack, Group, Avatar, Text, Image, Box, ActionIcon, Badge, Tooltip, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconChevronLeft, IconChevronRight, IconEdit, IconTrash } from '@tabler/icons-react';
import { formatImageSrc } from '../utils';
import { formatDateTime } from '../utils';
import { useAuth } from '../auth';
import { storyService, type StoryResource } from '../api/services';
import type { UserResource } from '../api/services';
import { EntryTypeEnum } from '../enums/EntryTypeEnum';
import { EntityViewCounter } from './EntityViewCounter';
import { openConfirmActionModal } from '../utils';
import { useOffline } from '../services';

export interface UserStoriesGroup {
    userId: string;
    author?: UserResource | null;
    stories: StoryResource[];
    newestStory?: StoryResource;
}

interface StoryViewerModalProps {
    opened: boolean;
    onClose: () => void;
    groups?: UserStoriesGroup[];
    initialGroupIndex?: number;
    initialStoryIndex?: number;
    story?: StoryResource | null;
    author?: UserResource | null;
    onEdit?: (story: StoryResource) => void;
    onDelete?: (storyId: string) => void;
    paginateUserStories?: boolean;
    updatedStory?: StoryResource | null;
}

export function StoryViewerModal({
    opened,
    onClose,
    groups,
    initialGroupIndex = 0,
    initialStoryIndex = 0,
    story,
    author,
    onEdit,
    onDelete,
    paginateUserStories = true,
    updatedStory,
}: StoryViewerModalProps) {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { isOffline } = useOffline();

    const effectiveGroups: UserStoriesGroup[] =
        groups && groups.length > 0 ? groups : story ? [{ userId: story.userId, author, stories: [story] }] : [];

    const [currentGroupIdx, setCurrentGroupIdx] = useState(initialGroupIndex);
    const [currentStoryIdx, setCurrentStoryIdx] = useState(initialStoryIndex);
    const prevOpenedRef = useRef(false);

    const [storyOverrides, setStoryOverrides] = useState<Record<string, StoryResource>>({});
    const [userStoriesMap, setUserStoriesMap] = useState<
        Record<
            string,
            {
                stories: StoryResource[];
                page: number;
                hasNextPage: boolean;
                isLoading: boolean;
            }
        >
    >({});

    useEffect(() => {
        if (opened && !prevOpenedRef.current) {
            setCurrentGroupIdx(initialGroupIndex);
            setCurrentStoryIdx(initialStoryIndex);
            setUserStoriesMap({});
            setStoryOverrides({});
        }
        prevOpenedRef.current = opened;
    }, [opened, initialGroupIndex, initialStoryIndex]);

    useEffect(() => {
        if (!updatedStory) return;
        setStoryOverrides((prev) => ({
            ...prev,
            [updatedStory.id]: updatedStory,
        }));
        setUserStoriesMap((prev) => {
            const userId = updatedStory.userId;
            const current = prev[userId];
            if (!current) return prev;
            return {
                ...prev,
                [userId]: {
                    ...current,
                    stories: current.stories.map((s) => (s.id === updatedStory.id ? updatedStory : s)),
                },
            };
        });
    }, [updatedStory]);

    const currentGroup = effectiveGroups[currentGroupIdx];
    const currentUserId = currentGroup?.userId;
    const userState = paginateUserStories && currentUserId ? userStoriesMap[currentUserId] : undefined;
    const currentStories =
        userState?.stories && userState.stories.length > 0 ? userState.stories : (currentGroup?.stories ?? []);
    const rawStory = currentStories[currentStoryIdx] ?? currentStories[0];
    const currentStory = rawStory ? (storyOverrides[rawStory.id] ?? rawStory) : rawStory;
    const currentAuthor = currentGroup?.author ?? author;

    const fetchUserStoriesPage = useCallback(async (userId: string, pageToFetch: number) => {
        setUserStoriesMap((prev) => ({
            ...prev,
            [userId]: {
                stories: prev[userId]?.stories ?? [],
                page: pageToFetch,
                hasNextPage: prev[userId]?.hasNextPage ?? false,
                isLoading: true,
            },
        }));

        try {
            const res = await storyService.getStories({
                params: {
                    query: {
                        filter: { userId },
                        page: pageToFetch,
                        limit: 10,
                        sort: 'createdAt:desc',
                    },
                },
            });
            const fetched = res.data ?? [];
            const hasNextPage = !!res.pagination?.hasNextPage;

            setUserStoriesMap((prev) => {
                const currentList = prev[userId]?.stories ?? [];
                const existingMap = new Map<string, StoryResource>();
                currentList.forEach((s) => existingMap.set(s.id, s));
                fetched.forEach((s) => existingMap.set(s.id, s));
                const parseTime = (dateStr?: string) => (dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0);
                const combined = Array.from(existingMap.values()).sort(
                    (a, b) => parseTime(b.createdAt) - parseTime(a.createdAt),
                );
                return {
                    ...prev,
                    [userId]: {
                        stories: combined,
                        page: pageToFetch,
                        hasNextPage,
                        isLoading: false,
                    },
                };
            });
        } catch {
            setUserStoriesMap((prev) => ({
                ...prev,
                [userId]: {
                    ...(prev[userId] ?? { stories: [], page: 1, hasNextPage: false }),
                    isLoading: false,
                },
            }));
        }
    }, []);

    useEffect(() => {
        if (!opened || !paginateUserStories || !currentUserId) return;
        if (!userStoriesMap[currentUserId]) {
            void fetchUserStoriesPage(currentUserId, 1);
        }
    }, [opened, paginateUserStories, currentUserId, userStoriesMap, fetchUserStoriesPage]);

    useEffect(() => {
        if (!opened || !paginateUserStories || !currentUserId) return;
        const state = userStoriesMap[currentUserId];
        if (!state || state.isLoading) return;
        if (currentStoryIdx >= state.stories.length - 1 && state.hasNextPage) {
            void fetchUserStoriesPage(currentUserId, state.page + 1);
        }
    }, [opened, paginateUserStories, currentUserId, currentStoryIdx, userStoriesMap, fetchUserStoriesPage]);

    const hasPrevStory = currentStoryIdx > 0;
    const hasNextStory = currentStoryIdx < currentStories.length - 1;
    const hasPrevGroup = currentGroupIdx > 0;
    const hasNextGroup = currentGroupIdx < effectiveGroups.length - 1;
    const isFetchingMoreCurrentStories = !!(userState?.isLoading && !hasNextStory);

    const handlePrevStory = useCallback(() => {
        if (hasPrevStory) {
            setCurrentStoryIdx((prev) => prev - 1);
        } else if (hasPrevGroup) {
            const prevGroup = effectiveGroups[currentGroupIdx - 1];
            const prevUserState = prevGroup?.userId ? userStoriesMap[prevGroup.userId] : undefined;
            const prevStories = prevUserState?.stories?.length ? prevUserState.stories : (prevGroup?.stories ?? []);
            setCurrentGroupIdx((prev) => prev - 1);
            setCurrentStoryIdx(Math.max(0, prevStories.length - 1));
        }
    }, [hasPrevStory, hasPrevGroup, effectiveGroups, currentGroupIdx, userStoriesMap]);

    const handleNextStory = useCallback(() => {
        if (hasNextStory) {
            setCurrentStoryIdx((prev) => prev + 1);
        } else if (isFetchingMoreCurrentStories) {
            return;
        } else if (hasNextGroup) {
            setCurrentGroupIdx((prev) => prev + 1);
            setCurrentStoryIdx(0);
        } else {
            onClose();
        }
    }, [hasNextStory, isFetchingMoreCurrentStories, hasNextGroup, onClose]);

    useEffect(() => {
        if (!opened) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handlePrevStory();
            } else if (e.key === 'ArrowRight') {
                handleNextStory();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [opened, handlePrevStory, handleNextStory]);

    if (!opened || !currentStory) return null;

    const authorName = currentAuthor
        ? `${currentAuthor.firstName ?? ''} ${currentAuthor.lastName ?? ''}`.trim() || t('stories')
        : t('stories');
    const authorPhoto = formatImageSrc(currentAuthor?.profilePhoto);
    const storyPhotoSrc = formatImageSrc(currentStory.photo);

    const isStoryOwner = !!(currentUser && currentStory && currentUser.id === currentStory.userId);

    return (
        <Modal.Root opened={opened} onClose={onClose} centered zIndex={200}>
            <Modal.Overlay />
            <Modal.Content>
                <Modal.Header className="story-modal-header">
                    <Stack gap={6} w="100%">
                        <Box className="story-progress-bar-container">
                            {currentStories.map((s, idx) => (
                                <Box
                                    key={s.id}
                                    className={`story-progress-segment ${
                                        idx === currentStoryIdx
                                            ? 'story-progress-segment-active'
                                            : idx < currentStoryIdx
                                              ? 'story-progress-segment-viewed'
                                              : 'story-progress-segment-unviewed'
                                    }`}
                                />
                            ))}
                        </Box>

                        <Group justify="space-between" align="center" wrap="nowrap" w="100%">
                            <Group wrap="nowrap">
                                {currentAuthor?.link && !isOffline ? (
                                    <Anchor component={Link} to={`/users/${currentAuthor.link}`} underline="never">
                                        <Avatar src={authorPhoto}>?</Avatar>
                                    </Anchor>
                                ) : (
                                    <Avatar
                                        src={authorPhoto}
                                        style={
                                            isOffline && currentAuthor?.link
                                                ? { opacity: 0.5, cursor: 'not-allowed' }
                                                : undefined
                                        }
                                    >
                                        ?
                                    </Avatar>
                                )}
                                <Box>
                                    {currentAuthor?.link && !isOffline ? (
                                        <Anchor
                                            size="sm"
                                            fw={600}
                                            component={Link}
                                            to={`/users/${currentAuthor.link}`}
                                            c="inherit"
                                            underline="hover"
                                        >
                                            {authorName}
                                        </Anchor>
                                    ) : (
                                        <Text
                                            size="sm"
                                            fw={600}
                                            style={
                                                isOffline && currentAuthor?.link
                                                    ? { opacity: 0.5, cursor: 'not-allowed' }
                                                    : undefined
                                            }
                                        >
                                            {authorName}
                                        </Text>
                                    )}
                                    <Text size="sm" c="dimmed">
                                        {formatDateTime(currentStory.createdAt)}
                                    </Text>
                                </Box>
                            </Group>

                            <Group gap="xs" align="center" wrap="nowrap">
                                <Badge>
                                    {currentStoryIdx + 1} / {currentStories.length}
                                </Badge>
                                {currentStory && (
                                    <Badge>
                                        <EntityViewCounter
                                            key={currentStory.id}
                                            entityId={currentStory.id}
                                            type={EntryTypeEnum.STORY}
                                            size={14}
                                            textSize="xs"
                                            track={opened}
                                            showTooltip={false}
                                        />
                                    </Badge>
                                )}
                                {isStoryOwner && (
                                    <>
                                        {onEdit && (
                                            <Tooltip label={t('edit')}>
                                                <ActionIcon
                                                    disabled={isOffline}
                                                    onClick={(e) => {
                                                        if (isOffline) return;
                                                        e.stopPropagation();
                                                        onEdit(currentStory);
                                                    }}
                                                    aria-label={t('edit')}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                        {onDelete && (
                                            <Tooltip label={t('delete')}>
                                                <ActionIcon
                                                    color="red"
                                                    disabled={isOffline}
                                                    onClick={(e) => {
                                                        if (isOffline) return;
                                                        e.stopPropagation();
                                                        const storyIdToDelete = currentStory.id;
                                                        openConfirmActionModal({
                                                            title: t('confirmDeleteTitle'),
                                                            message: t('confirmDeleteMessage'),
                                                            confirmLabel: t('delete'),
                                                            cancelLabel: t('cancel'),
                                                            onConfirm: () => {
                                                                const remainingStories = currentStories.filter(
                                                                    (s) => s.id !== storyIdToDelete,
                                                                );

                                                                if (currentUserId) {
                                                                    setUserStoriesMap((prev) => {
                                                                        const current = prev[currentUserId];
                                                                        if (!current) return prev;
                                                                        return {
                                                                            ...prev,
                                                                            [currentUserId]: {
                                                                                ...current,
                                                                                stories: remainingStories,
                                                                            },
                                                                        };
                                                                    });
                                                                }

                                                                if (remainingStories.length === 0) {
                                                                    if (hasNextGroup) {
                                                                        setCurrentGroupIdx((prev) => prev + 1);
                                                                        setCurrentStoryIdx(0);
                                                                    } else if (hasPrevGroup) {
                                                                        setCurrentGroupIdx((prev) => prev - 1);
                                                                        setCurrentStoryIdx(0);
                                                                    } else {
                                                                        onClose();
                                                                    }
                                                                } else {
                                                                    if (currentStoryIdx >= remainingStories.length) {
                                                                        setCurrentStoryIdx(
                                                                            Math.max(0, remainingStories.length - 1),
                                                                        );
                                                                    }
                                                                }
                                                                onDelete(storyIdToDelete);
                                                            },
                                                        });
                                                    }}
                                                    aria-label={t('delete')}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </>
                                )}
                                <Modal.CloseButton data-offline-allowed="true" />
                            </Group>
                        </Group>
                    </Stack>
                </Modal.Header>
                <Modal.Body>
                    <Stack align="center" pos="relative">
                        <Box className="story-viewer-viewport">
                            <Tooltip label={t('previous')}>
                                <ActionIcon
                                    variant="filled"
                                    size={32}
                                    className="story-nav-btn story-nav-btn-prev"
                                    disabled={(!hasPrevStory && !hasPrevGroup) || isOffline}
                                    onClick={(e) => {
                                        if (isOffline) return;
                                        e.stopPropagation();
                                        handlePrevStory();
                                    }}
                                    aria-label={t('previous')}
                                >
                                    <IconChevronLeft size={18} />
                                </ActionIcon>
                            </Tooltip>

                            {storyPhotoSrc ? (
                                <Image
                                    src={storyPhotoSrc}
                                    alt={currentStory.text || t('stories')}
                                    className="story-viewer-image"
                                />
                            ) : (
                                <Box w="100%" h="100%" />
                            )}

                            <Tooltip label={t('next')}>
                                <ActionIcon
                                    variant="filled"
                                    size={32}
                                    className="story-nav-btn story-nav-btn-next"
                                    loading={!isOffline && isFetchingMoreCurrentStories}
                                    disabled={isOffline}
                                    onClick={(e) => {
                                        if (isOffline) return;
                                        e.stopPropagation();
                                        handleNextStory();
                                    }}
                                    aria-label={t('next')}
                                >
                                    <IconChevronRight size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Box>

                        <Box className="story-text-caption">
                            {currentStory.text ? (
                                <Text size="sm" ta="center" className="pre-wrap">
                                    {currentStory.text}
                                </Text>
                            ) : null}
                        </Box>
                    </Stack>
                </Modal.Body>
            </Modal.Content>
        </Modal.Root>
    );
}
