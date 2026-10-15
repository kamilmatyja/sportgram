import React, { useState } from 'react';
import { Button, Container, Card, Stack } from 'react-bootstrap';

import { StoryViewerModal } from './StoryViewerModal';
import { StoryResponse } from '../../api/responses/StoryResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { useFeedStories } from '../../services/Story/useFeedStories';
import { formatUserName } from '../../utils/user';
import { Base64Image } from '../Common/Base64Image';
import BootstrapIcon from '../Common/BootstrapIcon';

export type FlatStory = StoryResponse & { user: UserResponse };

export const StoriesCarousel: React.FC<{ targetUserId?: string }> = ({ targetUserId }) => {
    const { t } = useTranslation();
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
                            <Button
                                key={item.user.id}
                                variant="link"
                                className="story-item p-0 border-0 text-body text-decoration-none"
                                aria-label={`${t('entryTypes.story')}: ${formatUserName(item.user)}`}
                                onClick={() => setActiveStoryIndex(item.firstStoryIndex)}
                            >
                                <Stack as="span" className={`story-avatar-container profile-theme-bg ${themeClass}`}>
                                    <Base64Image
                                        data={item.user.profilePhoto}
                                        className="story-avatar"
                                        alt=""
                                        fallback={
                                            <Stack
                                                as="span"
                                                className="story-avatar bg-secondary align-items-center justify-content-center text-white"
                                            >
                                                <BootstrapIcon name="person" />
                                            </Stack>
                                        }
                                    />
                                </Stack>
                                <Stack as="small" className="text-truncate w-100 text-center">
                                    {item.user.firstName}
                                </Stack>
                            </Button>
                        );
                    })}
                </Card.Body>
            </Card>

            <StoryViewerModal
                key={activeStoryIndex ?? -1}
                show={activeStoryIndex !== null}
                stories={flatStories}
                initialIndex={activeStoryIndex ?? 0}
                onClose={() => setActiveStoryIndex(null)}
            />
        </Container>
    );
};
