import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {FeedResponse} from '../api/responses/FeedResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {formatDate} from '../utils/dateFormat';
import {FeedReactionEnum} from '../enums/FeedReactionEnum';

interface HomeFeedsViewProps {
    feeds: FeedResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    actionLoading: string | null;
    commentInputs: Record<string, string>;
    editingCommentId: string | null;
    editCommentText: string;
    setEditCommentText: (text: string) => void;
    setEditingCommentId: (id: string | null) => void;
    handleLoadMore: () => void;
    handleReaction: (feedId: string, type: number) => void;
    handleCommentInput: (feedId: string, value: string) => void;
    handleAddComment: (e: React.SyntheticEvent<HTMLFormElement>, feedId: string) => void;
    handleDeleteComment: (feedId: string, commentId: string) => void;
    startEditingComment: (commentId: string, text: string) => void;
    handleUpdateComment: (feedId: string, commentId: string) => void;
}

export const HomeFeedsView: React.FC<HomeFeedsViewProps> = ({
                                                                feeds, relatedUsers, currentUser, loading, loadingMore, hasMore, actionLoading,
                                                                commentInputs, editingCommentId, editCommentText, setEditCommentText, setEditingCommentId,
                                                                handleLoadMore, handleReaction, handleCommentInput, handleAddComment, handleDeleteComment,
                                                                startEditingComment, handleUpdateComment
                                                            }) => {
    const {t} = useTranslation();

    if (loading && feeds.length === 0) {
        return <div className="container mt-5 text-center"><div className="spinner-border"/></div>;
    }

    const getFeedTypeLabel = (feed: FeedResponse) => {
        if (feed.eventDisciplineList) return t('feedTypes.eventDisciplineList');
        if (feed.eventDisciplineResult) return t('feedTypes.eventDisciplineResult');
        if (feed.goal) return t('feedTypes.goal');
        if (feed.goalParticipantResult) return t('feedTypes.goalParticipantResult');
        if (feed.training) return t('feedTypes.training');
        return t('feedTypes.regular');
    };

    const getReactionIcon = (type: number) => {
        switch (type) {
            case FeedReactionEnum.LIKE: return 'bi-hand-thumbs-up-fill text-primary';
            case FeedReactionEnum.LOVE: return 'bi-heart-fill text-danger';
            case FeedReactionEnum.HAHA: return 'bi-emoji-laughing-fill text-warning';
            case FeedReactionEnum.WOW: return 'bi-emoji-surprise-fill text-warning';
            case FeedReactionEnum.SAD: return 'bi-emoji-frown-fill text-warning';
            case FeedReactionEnum.ANGRY: return 'bi-emoji-angry-fill text-danger';
            default: return 'bi-hand-thumbs-up';
        }
    };

    return (
        <div className="container mt-4 mb-5 mx-auto feed-container">
            {feeds.length === 0 ? (
                <div className="text-center text-muted p-5 bg-light rounded">
                    {t('noFeeds')}
                </div>
            ) : (
                feeds.map(feed => {
                    const author = relatedUsers[feed.userId];
                    const isFeedLoading = actionLoading === feed.id;
                    const myReaction = feed.reactions?.find(r => r.userId === currentUser?.id);

                    return (
                        <div key={feed.id} className="card shadow-sm mb-4">
                            <div className="card-header bg-white d-flex align-items-center gap-3 border-bottom-0 pt-3">
                                {author?.profilePhoto ? (
                                    <img src={`data:image/webp;base64,${author.profilePhoto}`} alt="avatar" className="rounded-circle object-fit-cover feed-avatar-48" />
                                ) : (
                                    <div className="bg-secondary rounded-circle feed-avatar-48"></div>
                                )}
                                <div className="flex-grow-1">
                                    <a href={`/users/${author?.link}`} className="fw-bold text-decoration-none text-body d-block">
                                        {author ? `${author.firstName} ${author.lastName}` : feed.userId}
                                    </a>
                                    <div className="d-flex align-items-center gap-2">
                                        <small className="text-muted">{formatDate(feed.createdAt)}</small>
                                        <span className="badge bg-light text-dark border">{getFeedTypeLabel(feed)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body py-2">
                                {feed.text && <p className="card-text text-break">{feed.text}</p>}
                            </div>

                            {feed.photo && (
                                <img src={`data:image/webp;base64,${feed.photo}`} alt="feed" className="w-100 object-fit-cover feed-image-max" />
                            )}

                            <div className="card-footer bg-white pt-3 pb-2">
                                <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                                    <div className="text-muted small">
                                        {feed.reactions && feed.reactions.length > 0 && (
                                            <><i className="bi bi-hand-thumbs-up-fill text-primary me-1"></i> {feed.reactions.length}</>
                                        )}
                                    </div>
                                    <div className="text-muted small">
                                        {feed.comments && feed.comments.length > 0 && (
                                            <>{feed.comments.length} {t('comments')}</>
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex flex-wrap gap-1 border-top border-bottom py-2 justify-content-between">
                                    {FeedReactionEnum.getOptions(t).map(opt => {
                                        const isActive = myReaction?.reaction === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                className={`btn btn-sm flex-grow-1 ${isActive ? 'bg-light fw-bold' : 'btn-light bg-transparent'}`}
                                                disabled={isFeedLoading}
                                                onClick={() => handleReaction(feed.id, opt.value)}
                                            >
                                                <i className={`${getReactionIcon(opt.value)} me-1`}></i>
                                                <span className="d-none d-sm-inline">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

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
                                                        <a href={`/users/${commentAuthor?.link}`} className="fw-bold text-decoration-none text-body small d-block">
                                                            {commentAuthor ? `${commentAuthor.firstName} ${commentAuthor.lastName}` : comment.userId}
                                                        </a>

                                                        {isEditing ? (
                                                            <div className="mt-1">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm mb-1"
                                                                    value={editCommentText}
                                                                    onChange={e => setEditCommentText(e.target.value)}
                                                                />
                                                                <div className="d-flex justify-content-end gap-1">
                                                                    <button className="btn btn-xs btn-outline-secondary py-0" onClick={() => setEditingCommentId(null)} disabled={isFeedLoading}>{t('cancel')}</button>
                                                                    <button className="btn btn-xs btn-primary py-0" onClick={() => handleUpdateComment(feed.id, comment.id)} disabled={isFeedLoading}>{t('save')}</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="small text-break">{comment.text}</span>
                                                        )}
                                                    </div>

                                                    {!isEditing && isMyComment && (
                                                        <div className="ms-2 mt-1 gap-2 d-flex">
                                                            <button className="btn btn-link p-0 text-muted small text-decoration-none" onClick={() => startEditingComment(comment.id, comment.text)} disabled={isFeedLoading}>{t('edit')}</button>
                                                            <button className="btn btn-link p-0 text-danger small text-decoration-none" onClick={() => handleDeleteComment(feed.id, comment.id)} disabled={isFeedLoading}>{t('delete')}</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <form onSubmit={(e) => handleAddComment(e, feed.id)} className="d-flex gap-2 mt-3">
                                        {currentUser?.profilePhoto ? (
                                            <img src={`data:image/webp;base64,${currentUser.profilePhoto}`} alt="avatar" className="rounded-circle object-fit-cover flex-shrink-0 feed-avatar-32" />
                                        ) : (
                                            <div className="bg-secondary rounded-circle flex-shrink-0 feed-avatar-32"></div>
                                        )}
                                        <input
                                            type="text"
                                            className="form-control form-control-sm rounded-pill px-3"
                                            placeholder={t('writeComment')}
                                            value={commentInputs[feed.id] || ''}
                                            onChange={e => handleCommentInput(feed.id, e.target.value)}
                                            disabled={isFeedLoading}
                                        />
                                        <button type="submit" className="btn btn-sm btn-primary rounded-circle px-2" disabled={isFeedLoading || !(commentInputs[feed.id]?.trim())}>
                                            <i className="bi bi-send-fill"></i>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {feeds.length > 0 && (
                <div className="text-center mt-4">
                    {hasMore ? (
                        <button className="btn btn-outline-primary" onClick={handleLoadMore} disabled={loadingMore}>
                            {loadingMore ? <span className="spinner-border spinner-border-sm" /> : t('loadMore')}
                        </button>
                    ) : (
                        <span className="text-muted">{t('noMoreFeeds')}</span>
                    )}
                </div>
            )}
        </div>
    );
};