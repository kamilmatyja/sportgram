import { useEffect, useState, useCallback, useRef } from 'react';
import { Modal, Stack, Group, Avatar, Text, Image, Box, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { formatImageSrc } from '../utils/imageUtils';
import type { StoryResource } from '../api/services/story.service';
import type { UserResource } from '../api/services/user.service';

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
}

export function StoryViewerModal({
    opened,
    onClose,
    groups,
    initialGroupIndex = 0,
    initialStoryIndex = 0,
    story,
    author,
}: StoryViewerModalProps) {
    const { t } = useTranslation();

    const effectiveGroups: UserStoriesGroup[] =
        groups && groups.length > 0 ? groups : story ? [{ userId: story.userId, author, stories: [story] }] : [];

    const [currentGroupIdx, setCurrentGroupIdx] = useState(initialGroupIndex);
    const [currentStoryIdx, setCurrentStoryIdx] = useState(initialStoryIndex);
    const prevOpenedRef = useRef(false);

    useEffect(() => {
        if (opened && !prevOpenedRef.current) {
            setCurrentGroupIdx(initialGroupIndex);
            setCurrentStoryIdx(initialStoryIndex);
        }
        prevOpenedRef.current = opened;
    }, [opened, initialGroupIndex, initialStoryIndex]);

    const currentGroup = effectiveGroups[currentGroupIdx];
    const currentStories = currentGroup?.stories ?? [];
    const currentStory = currentStories[currentStoryIdx];
    const currentAuthor = currentGroup?.author ?? author;

    const hasPrevStory = currentStoryIdx > 0;
    const hasNextStory = currentStoryIdx < currentStories.length - 1;
    const hasPrevGroup = currentGroupIdx > 0;
    const hasNextGroup = currentGroupIdx < effectiveGroups.length - 1;

    const handlePrevStory = useCallback(() => {
        if (hasPrevStory) {
            setCurrentStoryIdx((prev) => prev - 1);
        } else if (hasPrevGroup) {
            const prevGroupStories = effectiveGroups[currentGroupIdx - 1]?.stories ?? [];
            setCurrentGroupIdx((prev) => prev - 1);
            setCurrentStoryIdx(Math.max(0, prevGroupStories.length - 1));
        }
    }, [hasPrevStory, hasPrevGroup, effectiveGroups, currentGroupIdx]);

    const handleNextStory = useCallback(() => {
        if (hasNextStory) {
            setCurrentStoryIdx((prev) => prev + 1);
        } else if (hasNextGroup) {
            setCurrentGroupIdx((prev) => prev + 1);
            setCurrentStoryIdx(0);
        } else {
            onClose();
        }
    }, [hasNextStory, hasNextGroup, onClose]);

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

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="md"
            centered
            closeButtonProps={{ size: 30 }}
            title={
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
                                    <Avatar src={authorPhoto} radius="xl" size="md">
                                        ?
                                    </Avatar>
                                </Link>
                            ) : (
                                <Avatar src={authorPhoto} radius="xl" size="md">
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
                                    {currentStory.createdAt
                                        ? new Date(currentStory.createdAt.replace(' ', 'T')).toLocaleString()
                                        : ''}
                                </Text>
                            </Box>
                        </Group>

                        <Badge variant="light" size="sm" className="story-counter-badge">
                            {currentStoryIdx + 1} / {currentStories.length}
                        </Badge>
                    </Group>
                </Stack>
            }
        >
            <Stack gap="md" align="center" pos="relative">
                <Box className="story-viewer-viewport">
                    {/* Left click area to navigate to previous story */}
                    <Box
                        className={`story-click-zone-left ${hasPrevStory || hasPrevGroup ? '' : 'disabled'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrevStory();
                        }}
                    />

                    {/* Right click area to navigate to next story */}
                    <Box
                        className="story-click-zone-right"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNextStory();
                        }}
                    />

                    {/* Previous Button */}
                    {(hasPrevStory || hasPrevGroup) && (
                        <Tooltip label={t('previous', 'Poprzedni')} withArrow>
                            <ActionIcon
                                variant="filled"
                                size={30}
                                className="story-nav-btn story-nav-btn-prev"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrevStory();
                                }}
                                aria-label={t('previous', 'Poprzedni')}
                            >
                                <IconChevronLeft size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    {/* Story photo */}
                    {storyPhotoSrc ? (
                        <Image
                            src={storyPhotoSrc}
                            alt={currentStory.text || t('stories')}
                            className="story-viewer-image"
                        />
                    ) : (
                        <Box className="story-empty-box" />
                    )}

                    {/* Next Button */}
                    <Tooltip label={t('next', 'Następny')} withArrow>
                        <ActionIcon
                            variant="filled"
                            size={30}
                            className="story-nav-btn story-nav-btn-next"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNextStory();
                            }}
                            aria-label={t('next', 'Następny')}
                        >
                            <IconChevronRight size={16} />
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
        </Modal>
    );
}

export default StoryViewerModal;
