import React from 'react';
import { Card, Stack, Badge } from 'react-bootstrap';

import { FeedComments } from './FeedComments';
import { FeedReactions } from './FeedReactions';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { formatDate } from '../../utils/dateFormat';
import { Base64Image } from '../Common/Base64Image';
import { FormErrorAlert } from '../Common/FormFields';
import { UserAvatar } from '../Common/UserAvatar';
import { UserLink } from '../Common/UserLink';

interface FeedCardProps {
    feed: FeedResponse;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isFeedLoading: boolean;
    actionError?: string | null;
    commentInputValue: string;
    editingCommentId: string | null;
    editCommentText: string;
    interactions: any;
}

export const getFeedTypeLabel = (feed: FeedResponse, t: (key: string) => string): string => {
    if (feed.eventDisciplineList) return t('feedTypes.eventDisciplineList');
    if (feed.eventDisciplineResult) return t('feedTypes.eventDisciplineResult');
    if (feed.goal) return t('feedTypes.goal');
    if (feed.goalParticipantResult) return t('feedTypes.goalParticipantResult');
    if (feed.training) return t('feedTypes.training');
    return t('feedTypes.regular');
};

export const FeedCard: React.FC<FeedCardProps> = ({
    feed,
    currentUser,
    relatedUsers,
    isFeedLoading,
    actionError,
    commentInputValue,
    editingCommentId,
    editCommentText,
    interactions,
}) => {
    const { t } = useTranslation();
    const author = relatedUsers?.[feed.userId];
    const myReaction = feed.reactions?.find((r) => r.userId === currentUser?.id);

    return (
        <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white d-flex align-items-center gap-3 border-bottom-0 pt-3">
                <UserAvatar user={author} size={48} className="border profile-theme-border" />
                <Stack>
                    <UserLink user={author} className="text-body" />
                    <Stack direction="horizontal" gap={2} className="align-items-center">
                        <Stack as="small" className="text-muted small">
                            {formatDate(feed.createdAt)}
                        </Stack>
                        <Badge bg="light" text="dark" className="border profile-theme-border fw-normal">
                            {getFeedTypeLabel(feed, t)}
                        </Badge>
                    </Stack>
                </Stack>
            </Card.Header>

            <Card.Body className="py-2">
                {feed.text && <Card.Text className="text-break">{feed.text}</Card.Text>}
            </Card.Body>

            <Base64Image data={feed.photo} className="w-100 object-fit-cover feed-image-max" />

            <Card.Footer className="bg-white pt-2 pb-3 border-top-0">
                <FormErrorAlert error={actionError} className="py-2 small" />
                <Stack direction="horizontal" className="justify-content-between text-muted small px-1 pb-2">
                    <Stack as="span">
                        {feed.reactions?.length || 0} {t('reactions').toLowerCase()}
                    </Stack>
                    <Stack as="span">
                        {feed.comments?.length || 0} {t('comments').toLowerCase()}
                    </Stack>
                </Stack>

                <FeedReactions
                    feed={feed}
                    myReactionType={myReaction?.reaction}
                    isFeedLoading={isFeedLoading}
                    onReact={interactions.handleReaction}
                />
                <FeedComments
                    feed={feed}
                    currentUser={currentUser}
                    relatedUsers={relatedUsers}
                    isFeedLoading={isFeedLoading}
                    editingCommentId={editingCommentId}
                    editCommentText={editCommentText}
                    commentInputValue={commentInputValue}
                    onCommentInput={interactions.handleCommentInput}
                    onAddComment={interactions.handleAddComment}
                    onDeleteComment={interactions.handleDeleteComment}
                    onStartEditing={interactions.startEditingComment}
                    onCancelEditing={() => interactions.setEditingCommentId(null)}
                    onUpdateComment={interactions.handleUpdateComment}
                    setEditCommentText={interactions.setEditCommentText}
                />
            </Card.Footer>
        </Card>
    );
};
