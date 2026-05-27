import React from 'react';
import { useTranslation } from '../../context/TranslationContext.tsx';
import { FeedResponse } from '../../api/responses/FeedResponse.ts';
import { UserResponse } from '../../api/responses/UserResponse.ts';

interface FeedCommentsProps {
    feed: FeedResponse;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isFeedLoading: boolean;
    editingCommentId: string | null;
    editCommentText: string;
    commentInputValue: string;
    onCommentInput: (feedId: string, value: string) => void;
    onAddComment: (e: React.SyntheticEvent<HTMLFormElement>, feedId: string) => void;
    onDeleteComment: (feedId: string, commentId: string) => void;
    onStartEditing: (commentId: string, text: string) => void;
    onCancelEditing: () => void;
    onUpdateComment: (feedId: string, commentId: string) => void;
    setEditCommentText: (text: string) => void;
}

export const FeedComments: React.FC<FeedCommentsProps> = ({
                                                              feed, currentUser, relatedUsers, isFeedLoading, editingCommentId, editCommentText, commentInputValue,
                                                              onCommentInput, onAddComment, onDeleteComment, onStartEditing, onCancelEditing, onUpdateComment, setEditCommentText
                                                          }) => {
    const { t } = useTranslation();

    return (
        <div className="mt-3">
            {feed.comments?.map(comment => {
                const commentAuthor = relatedUsers[comment.userId];
                const isMyComment = comment.userId === currentUser?.id;
                const isEditing = editingCommentId === comment.id;

                return (
                    <div key={comment.id} className="d-flex gap-2 mb-3">
                        {commentAuthor?.profilePhoto ? (
                            <img src={`data:image/webp;base64,${commentAuthor.profilePhoto}`} alt="avatar" className="rounded-circle object-fit-cover flex-shrink-0 feed-avatar-32" />
                        ) : (
                            <div className="bg-secondary rounded-circle flex-shrink-0 feed-avatar-32"></div>
                        )}

                        <div className="flex-grow-1">
                            <div className="bg-light p-2 rounded-3">
                                <a href={`/users/${commentAuthor?.link || comment.userId}`} className="fw-bold text-decoration-none text-body small d-block">
                                    {commentAuthor ? `${commentAuthor.firstName} ${commentAuthor.lastName}` : comment.userId}
                                </a>

                                {isEditing ? (
                                    <div className="mt-1">
                                        <input type="text" className="form-control form-control-sm mb-1" value={editCommentText} onChange={e => setEditCommentText(e.target.value)} />
                                        <div className="d-flex justify-content-end gap-1">
                                            <button className="btn btn-xs btn-outline-secondary py-0" onClick={onCancelEditing} disabled={isFeedLoading}>{t('cancel')}</button>
                                            <button className="btn btn-xs btn-profile-primary py-0" onClick={() => onUpdateComment(feed.id, comment.id)} disabled={isFeedLoading}>{t('save')}</button>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="small text-break">{comment.text}</span>
                                )}
                            </div>

                            {!isEditing && isMyComment && (
                                <div className="ms-2 mt-1 gap-2 d-flex">
                                    <button className="btn btn-link p-0 text-muted small text-decoration-none" onClick={() => onStartEditing(comment.id, comment.text)} disabled={isFeedLoading}>{t('edit')}</button>
                                    <button className="btn btn-link p-0 text-danger small text-decoration-none" onClick={() => onDeleteComment(feed.id, comment.id)} disabled={isFeedLoading}>{t('delete')}</button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            <form onSubmit={(e) => onAddComment(e, feed.id)} className="d-flex gap-2 mt-3">
                {currentUser?.profilePhoto ? (
                    <img src={`data:image/webp;base64,${currentUser.profilePhoto}`} alt="avatar" className="rounded-circle object-fit-cover flex-shrink-0 feed-avatar-32" />
                ) : (
                    <div className="bg-secondary rounded-circle flex-shrink-0 feed-avatar-32"></div>
                )}
                <input
                    type="text"
                    className="form-control form-control-sm rounded-pill px-3"
                    placeholder={t('writeComment')}
                    value={commentInputValue || ''}
                    onChange={e => onCommentInput(feed.id, e.target.value)}
                    disabled={isFeedLoading}
                />
                <button type="submit" className="btn btn-sm btn-profile-primary rounded-circle px-2" disabled={isFeedLoading || !(commentInputValue?.trim())}>
                    <i className="bi bi-send-fill"></i>
                </button>
            </form>
        </div>
    );
};