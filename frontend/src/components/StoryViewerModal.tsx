import { useEffect, useState, useCallback, useRef } from 'react';
import { Modal, Stack, Group, Avatar, Text, Image, Box, ActionIcon, Badge, Tooltip } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconChevronLeft, IconChevronRight, IconEdit, IconTrash } from '@tabler/icons-react';
import { formatImageSrc } from '../utils/imageUtils';
import { formatDateTime } from '../utils/date';
import { useAuth } from '../auth/AuthContext';
import { storyService, type StoryResource } from '../api/services/story.service';
import type { UserResource } from '../api/services/user.service';
import { EntryTypeEnum } from '../enums/EntryTypeEnum';
import { EntityViewCounter } from './EntityViewCounter';

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
                filter: { userId },
                page: pageToFetch,
                limit: 10,
                sort: 'createdAt:asc',
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
                    (a, b) => parseTime(a.createdAt) - parseTime(b.createdAt),
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
            fetchUserStoriesPage(currentUserId, 1);
        }
    }, [opened, paginateUserStories, currentUserId, userStoriesMap, fetchUserStoriesPage]);

    useEffect(() => {
        if (!opened || !paginateUserStories || !currentUserId) return;
        const state = userStoriesMap[currentUserId];
        if (!state || state.isLoading) return;
        if (currentStoryIdx >= state.stories.length - 1 && state.hasNextPage) {
            fetchUserStoriesPage(currentUserId, state.page + 1);
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
        <Modal.Root opened={opened} onClose={onClose} size="lg" centered>
            <Modal.Overlay />
            <Modal.Content>
                <Modal.Header className="story-modal-header">
                    <Stack gap={6} className="story-header-stack">
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
                            <Group gap="sm" wrap="nowrap">
                                {currentAuthor?.link ? (
                                    <Link to={`/users/${currentAuthor.link}`} className="no-decoration">
                                        <Avatar src={authorPhoto} radius={5} size="md">
                                            ?
                                        </Avatar>
                                    </Link>
                                ) : (
                                    <Avatar src={authorPhoto} radius={5} size="md">
                                        ?
                                    </Avatar>
                                )}
                                <Box>
                                    {currentAuthor?.link ? (
                                        <Text
                                            size="sm"
                                            fw={600}
                                            component={Link}
                                            to={`/users/${currentAuthor.link}`}
                                            className="no-decoration"
                                        >
                                            {authorName}
                                        </Text>
                                    ) : (
                                        <Text size="sm" fw={600}>
                                            {authorName}
                                        </Text>
                                    )}
                                    <Text size="xs" c="dimmed">
                                        {formatDateTime(currentStory.createdAt)}
                                    </Text>
                                </Box>
                            </Group>

                            <Group gap="xs" align="center" wrap="nowrap">
                                <Badge variant="light" size="sm" className="story-counter-badge">
                                    {currentStoryIdx + 1} / {currentStories.length}
                                </Badge>
                                {currentStory && (
                                    <Badge variant="light" size="sm">
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
                                            <Tooltip label={t('editStory')} withArrow>
                                                <ActionIcon
                                                    variant="light"
                                                    size={30}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(currentStory);
                                                    }}
                                                    aria-label={t('editStory')}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                        {onDelete && (
                                            <Tooltip label={t('delete')} withArrow>
                                                <ActionIcon
                                                    variant="light"
                                                    color="red"
                                                    size={30}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (currentUserId) {
                                                            setUserStoriesMap((prev) => {
                                                                const current = prev[currentUserId];
                                                                if (!current) return prev;
                                                                return {
                                                                    ...prev,
                                                                    [currentUserId]: {
                                                                        ...current,
                                                                        stories: current.stories.filter(
                                                                            (s) => s.id !== currentStory.id,
                                                                        ),
                                                                    },
                                                                };
                                                            });
                                                        }
                                                        if (
                                                            currentStoryIdx >= currentStories.length - 1 &&
                                                            currentStoryIdx > 0
                                                        ) {
                                                            setCurrentStoryIdx((prev) => prev - 1);
                                                        }
                                                        onDelete(currentStory.id);
                                                    }}
                                                    aria-label={t('delete')}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </>
                                )}
                                <Modal.CloseButton size={30} />
                            </Group>
                        </Group>
                    </Stack>
                </Modal.Header>
                <Modal.Body>
                    <Stack gap="md" align="center" pos="relative">
                        <Box className="story-viewer-viewport">
                            <ActionIcon
                                variant="filled"
                                size={32}
                                className="story-nav-btn story-nav-btn-prev"
                                disabled={!hasPrevStory && !hasPrevGroup}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrevStory();
                                }}
                                aria-label={t('previous', 'Poprzedni')}
                            >
                                <IconChevronLeft size={18} />
                            </ActionIcon>

                            {storyPhotoSrc ? (
                                <Image
                                    src={storyPhotoSrc}
                                    alt={currentStory.text || t('stories')}
                                    className="story-viewer-image"
                                />
                            ) : (
                                <Box className="story-empty-box" />
                            )}

                            <ActionIcon
                                variant="filled"
                                size={32}
                                className="story-nav-btn story-nav-btn-next"
                                loading={isFetchingMoreCurrentStories}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNextStory();
                                }}
                                aria-label={t('next', 'Następny')}
                            >
                                <IconChevronRight size={18} />
                            </ActionIcon>
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

export default StoryViewerModal;
