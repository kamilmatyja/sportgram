import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {FeedCard} from '../Feed/FeedCard';
import {Container, Stack, Spinner, Button} from 'react-bootstrap';

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
    const {t} = useTranslation();
    const {feeds, relatedUsers, currentUser, loading, loadingMore, hasMore, handleLoadMore} = props;

    if (loading && feeds.length === 0) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" className="text-profile-primary" />
            </Container>
        );
    }

    return (
        <Container className="mt-4 mb-5 mx-auto feed-container">
            {feeds.length === 0 ? (
                <Stack className="text-center text-muted">
                    {t('noRecords')}
                </Stack>
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
                <Stack className="text-center mt-4 align-items-center">
                    {hasMore ? (
                        <Button variant="profile-outline-primary" onClick={handleLoadMore} disabled={loadingMore}>
                            {loadingMore ? <Spinner animation="border" size="sm" /> : t('loadMore')}
                        </Button>
                    ) : (
                        <Stack as="span" className="text-muted">{t('noRecords')}</Stack>
                    )}
                </Stack>
            )}
        </Container>
    );
};