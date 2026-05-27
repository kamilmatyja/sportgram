import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { FeedCard } from '../Feed/FeedCard';

interface HomeFeedsViewProps {
    feeds: FeedResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    handleLoadMore: () => void;
    actionLoading: string | null;
    commentInputs: Record<string, string>;
    editingCommentId: string | null;
    editCommentText: string;
    setEditCommentText: (text: string) => void;
    setEditingCommentId: (id: string | null) => void;
    handleReaction: (feedId: string, type: number) => void;
    handleCommentInput: (feedId: string, value: string) => void;
    handleAddComment: (e: React.SyntheticEvent<HTMLFormElement>, feedId: string) => void;
    handleDeleteComment: (feedId: string, commentId: string) => void;
    startEditingComment: (commentId: string, text: string) => void;
    handleUpdateComment: (feedId: string, commentId: string) => void;
}

export const HomeFeedsView: React.FC<HomeFeedsViewProps> = (props) => {
    const { t } = useTranslation();
    const { feeds, relatedUsers, currentUser, loading, loadingMore, hasMore, handleLoadMore } = props;

    if (loading && feeds.length === 0) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-profile-primary" />
            </div>
        );
    }

    return (
        <div className="container mt-4 mb-5 mx-auto feed-container">
            {feeds.length === 0 ? (
                <div className="text-center text-muted p-5 bg-light rounded border">
                    {t('noFeeds')}
                </div>
            ) : (
                feeds.map(feed => (
                    <FeedCard
                        key={feed.id}
                        feed={feed}
                        currentUser={currentUser}
                        relatedUsers={relatedUsers}
                        isFeedLoading={props.actionLoading === feed.id}
                        commentInputValue={props.commentInputs[feed.id] || ''}
                        editingCommentId={props.editingCommentId}
                        editCommentText={props.editCommentText}
                        interactions={props}
                    />
                ))
            )}

            {feeds.length > 0 && (
                <div className="text-center mt-4">
                    {hasMore ? (
                        <button className="btn btn-profile-outline-primary" onClick={handleLoadMore} disabled={loadingMore}>
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