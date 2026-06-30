import React from 'react';
import { Card, Stack, Image, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { FeedComments } from './FeedComments';
import { FeedReactions } from './FeedReactions';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { formatDate } from '../../utils/dateFormat';

interface FeedCardProps {
    feed: FeedResponse;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isFeedLoading: boolean;
    commentInputValue: string;
    editingCommentId: string | null;
    editCommentText: string;
    interactions: any;
}

export const FeedCard: React.FC<FeedCardProps> = ({
    feed,
    currentUser,
    relatedUsers,
    isFeedLoading,
    commentInputValue,
    editingCommentId,
    editCommentText,
    interactions,
}) => {
    const { t } = useTranslation();
    const author = feed.user ?? relatedUsers?.[feed.userId];
    const myReaction = feed.reactions?.find((r) => r.userId === currentUser?.id);

    const getFeedTypeLabel = (feedObj: FeedResponse) => {
        if (feedObj.eventDisciplineList) return t('feedTypes.eventDisciplineList');
        if (feedObj.eventDisciplineResult) return t('feedTypes.eventDisciplineResult');
        if (feedObj.goal) return t('feedTypes.goal');
        if (feedObj.goalParticipantResult) return t('feedTypes.goalParticipantResult');
        if (feedObj.training) return t('feedTypes.training');
        return t('feedTypes.regular');
    };

    return (
        <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white d-flex align-items-center gap-3 border-bottom-0 pt-3">
                {author?.profilePhoto ? (
                    <Image
                        src={`data:image/webp;base64,${author.profilePhoto}`}
                        roundedCircle
                        className="object-fit-cover feed-avatar-48 border profile-theme-border"
                    />
                ) : (
                    <Stack className="bg-secondary rounded-circle feed-avatar-48" />
                )}
                <Stack>
                    <Link to={`/users/${author?.link || feed.userId}`} className="text-decoration-none text-body">
                        {author ? `${author.firstName} ${author.lastName}` : '-'}
                    </Link>
                    <Stack direction="horizontal" gap={2} className="align-items-center">
                        <Stack as="small" className="text-muted small">
                            {formatDate(feed.createdAt)}
                        </Stack>
                        <Badge bg="light" text="dark" className="border profile-theme-border fw-normal">
                            {getFeedTypeLabel(feed)}
                        </Badge>
                    </Stack>
                </Stack>
            </Card.Header>

            <Card.Body className="py-2">
                {feed.text && <Card.Text className="text-break">{feed.text}</Card.Text>}
            </Card.Body>

            {feed.photo && (
                <Image src={`data:image/webp;base64,${feed.photo}`} className="w-100 object-fit-cover feed-image-max" />
            )}

            <Card.Footer className="bg-white pt-2 pb-3 border-top-0">
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
