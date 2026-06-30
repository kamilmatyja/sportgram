import React, { useState } from 'react';
import { Container, Card, Stack, Image } from 'react-bootstrap';

import { StoryViewerModal } from './StoryViewerModal';
import { StoryResponse } from '../../api/responses/StoryResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { ColorEnum } from '../../enums/ColorEnum';
import { useFeedStories } from '../../services/Story/useFeedStories';
import BootstrapIcon from '../Common/BootstrapIcon';

export type FlatStory = StoryResponse & { user: UserResponse };

export const StoriesCarousel: React.FC<{ targetUserId?: string }> = ({ targetUserId }) => {
    const { stories, relatedUsers, loading, error } = useFeedStories(targetUserId);
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

    if (loading || error || stories.length === 0) return null;

    const grouped = stories.reduce(
        (acc, story) => {
            if (!acc[story.userId]) acc[story.userId] = [];
            acc[story.userId].push(story);
            return acc;
        },
        {} as Record<string, StoryResponse[]>,
    );

    const flatStories: FlatStory[] = Object.keys(grouped).flatMap((uId) => {
        const user = relatedUsers[uId];
        if (!user) return [];
        return grouped[uId]
            .slice()
            .reverse()
            .map((s) => ({ ...s, user }));
    });

    const carouselItems = Object.keys(grouped)
        .map((uId) => {
            const user = relatedUsers[uId];
            const firstStoryIndex = flatStories.findIndex((fs) => fs.user.id === uId);
            return { user, firstStoryIndex };
        })
        .filter((item) => item.user !== undefined);

    return (
        <Container className="mt-4 feed-container">
            <Card className="shadow-sm border-0">
                <Card.Body className="p-2 stories-carousel">
                    {carouselItems.map((item) => {
                        const themeClass = ColorEnum.getClass(item.user.color);
                        return (
                            <Stack
                                key={item.user.id}
                                className="story-item"
                                onClick={() => setActiveStoryIndex(item.firstStoryIndex)}
                            >
                                <Stack className={`story-avatar-container profile-theme-bg ${themeClass}`}>
                                    {item.user.profilePhoto ? (
                                        <Image
                                            src={`data:image/webp;base64,${item.user.profilePhoto}`}
                                            className="story-avatar"
                                            alt="avatar"
                                        />
                                    ) : (
                                        <Stack className="story-avatar bg-secondary align-items-center justify-content-center text-white">
                                            <BootstrapIcon name="person" />
                                        </Stack>
                                    )}
                                </Stack>
                                <Stack as="small" className="text-truncate w-100 text-center">
                                    {item.user.firstName}
                                </Stack>
                            </Stack>
                        );
                    })}
                </Card.Body>
            </Card>

            <StoryViewerModal
                show={activeStoryIndex !== null}
                stories={flatStories}
                initialIndex={activeStoryIndex ?? 0}
                onClose={() => setActiveStoryIndex(null)}
            />
        </Container>
    );
};
