import React from 'react';
import { Card, ScrollArea, Group, Stack, Avatar, Text, Center, Loader, UnstyledButton, Skeleton } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../../services';
import { formatImageSrc } from '../../utils';
import { type UserStoriesGroup } from '../StoryViewerModal';

export interface StoriesBarProps {
    groups: UserStoriesGroup[];
    onSelectGroup: (index: number) => void;
    onAddStory?: () => void;
    onAddFeed?: () => void;
    isLoading?: boolean;
    isFetchingMore?: boolean;
    viewportRef?: React.RefObject<HTMLDivElement | null>;
    onScrollPositionChange?: (pos: { x: number; y: number }) => void;
    lastStoryElementRef?: (node: HTMLElement | null) => void;
}

export function StoriesBar({
    groups,
    onSelectGroup,
    onAddStory,
    onAddFeed,
    isLoading,
    isFetchingMore,
    viewportRef,
    onScrollPositionChange,
    lastStoryElementRef,
}: StoriesBarProps) {
    const { t } = useTranslation();
    const { isOffline } = useOffline();

    return (
        <Card>
            <ScrollArea
                type="never"
                offsetScrollbars
                viewportRef={viewportRef}
                onScrollPositionChange={onScrollPositionChange}
            >
                <Group gap="md" wrap="nowrap">
                    {onAddStory && (
                        <UnstyledButton
                            onClick={isOffline ? undefined : onAddStory}
                            disabled={isOffline}
                            style={isOffline ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                        >
                            <Stack align="center" gap={4} miw={64}>
                                <Avatar radius="xl" size="lg">
                                    <IconPlus size={24} />
                                </Avatar>
                                <Text size="xs" lineClamp={1}>
                                    {t('addStory')}
                                </Text>
                            </Stack>
                        </UnstyledButton>
                    )}

                    {onAddFeed && (
                        <UnstyledButton
                            onClick={isOffline ? undefined : onAddFeed}
                            disabled={isOffline}
                            style={isOffline ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                        >
                            <Stack align="center" gap={4} miw={64}>
                                <Avatar radius="xl" size="lg">
                                    <IconPlus size={24} />
                                </Avatar>
                                <Text size="xs" lineClamp={1}>
                                    {t('addFeed')}
                                </Text>
                            </Stack>
                        </UnstyledButton>
                    )}

                    {isLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                              <Stack key={i} align="center" gap={4} miw={64}>
                                  <Skeleton height={56} circle />
                                  <Skeleton height={10} width={48} />
                              </Stack>
                          ))
                        : groups.map((group, gIdx) => {
                              const storyAuthor = group.author;
                              const storyImg =
                                  formatImageSrc(group.newestStory?.photo) || formatImageSrc(storyAuthor?.profilePhoto);
                              return (
                                  <UnstyledButton
                                      key={group.userId}
                                      ref={gIdx === groups.length - 1 ? lastStoryElementRef : undefined}
                                      onClick={isOffline ? undefined : () => onSelectGroup(gIdx)}
                                      disabled={isOffline}
                                      style={isOffline ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                                  >
                                      <Stack align="center" gap={4} miw={64}>
                                          <Avatar src={storyImg} size="lg" className="story-avatar-border">
                                              ?
                                          </Avatar>
                                          <Text size="xs" lineClamp={1}>
                                              {storyAuthor
                                                  ? `${storyAuthor.firstName ?? ''} ${storyAuthor.lastName ?? ''}`.trim() ||
                                                    t('user')
                                                  : t('user')}
                                          </Text>
                                      </Stack>
                                  </UnstyledButton>
                              );
                          })}

                    {isFetchingMore && (
                        <Center px="md">
                            <Loader size="sm" />
                        </Center>
                    )}
                </Group>
            </ScrollArea>
        </Card>
    );
}
