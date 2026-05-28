import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {formatDate} from '../../utils/dateFormat';
import {FeedReactions} from './FeedReactions';
import {FeedComments} from './FeedComments';

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
                                                      interactions
                                                  }) => {
    const {t} = useTranslation();
    const author = relatedUsers[feed.userId];
    const myReaction = feed.reactions?.find(r => r.userId === currentUser?.id);

    const getFeedTypeLabel = (feed: FeedResponse) => {
        if (feed.eventDisciplineList) return t('feedTypes.eventDisciplineList');
        if (feed.eventDisciplineResult) return t('feedTypes.eventDisciplineResult');
        if (feed.goal) return t('feedTypes.goal');
        if (feed.goalParticipantResult) return t('feedTypes.goalParticipantResult');
        if (feed.training) return t('feedTypes.training');
        return t('feedTypes.regular');
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header bg-white d-flex align-items-center gap-3 border-bottom-0 pt-3">
                {author?.profilePhoto ? (
                    <img src={`data:image/webp;base64,${author.profilePhoto}`} alt="avatar"
                         className="rounded-circle object-fit-cover feed-avatar-48 border profile-theme-border"/>
                ) : (
                    <div className="bg-secondary rounded-circle feed-avatar-48"></div>
                )}
                <div className="flex-grow-1">
                    <a href={`/users/${author?.link || feed.userId}`}
                       className="fw-bold text-decoration-none text-body d-block">
                        {author ? `${author.firstName} ${author.lastName}` : feed.userId}
                    </a>
                    <div className="d-flex align-items-center gap-2">
                        <small className="text-muted">{formatDate(feed.createdAt)}</small>
                        <span
                            className="badge bg-light text-dark border profile-theme-border">{getFeedTypeLabel(feed)}</span>
                    </div>
                </div>
            </div>

            <div className="card-body py-2">
                {feed.text && <p className="card-text text-break">{feed.text}</p>}
            </div>

            {feed.photo && (
                <img src={`data:image/webp;base64,${feed.photo}`} alt="feed"
                     className="w-100 object-fit-cover feed-image-max"/>
            )}

            <div className="card-footer bg-white pt-2 pb-2 border-top-0">
                <div className="d-flex justify-content-between text-muted small px-2 pb-2">
                    <span>{feed.reactions?.length || 0} {t('reactions').toLowerCase()}</span>
                    <span>{feed.comments?.length || 0} {t('comments').toLowerCase()}</span>
                </div>

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
            </div>
        </div>
    );
};