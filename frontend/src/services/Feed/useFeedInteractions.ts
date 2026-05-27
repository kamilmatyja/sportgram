import { useState } from 'react';
import { FeedProvider } from '../../api/providers/FeedProvider';
import { FeedCommentBody } from '../../api/body/FeedCommentBody';
import { FeedReactionBody } from '../../api/body/FeedReactionBody';
import { StatusBody } from '../../api/body/StatusBody';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';

export function useFeedInteractions(
    feeds: FeedResponse[],
    currentUser: UserResponse | null,
    refreshSingleFeed: (feedId: string) => void
) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState<string>('');

    const feedProvider = new FeedProvider();

    const handleReaction = async (feedId: string, reactionType: number) => {
        if (!currentUser) return;
        setActionLoading(feedId);
        const feed = feeds.find(f => f.id === feedId);
        if (!feed) return;

        const myReaction = feed.reactions?.find(r => r.userId === currentUser.id);

        try {
            if (myReaction) {
                if (myReaction.reaction === reactionType) {
                    await feedProvider.deleteReaction(myReaction.id);
                } else {
                    await feedProvider.updateReaction(myReaction.id, new FeedReactionBody(reactionType));
                }
            } else {
                await feedProvider.createReaction(feedId, new FeedReactionBody(reactionType));
            }
            refreshSingleFeed(feedId);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCommentInput = (feedId: string, value: string) => {
        setCommentInputs(prev => ({ ...prev, [feedId]: value }));
    };

    const handleAddComment = async (e: React.SyntheticEvent<HTMLFormElement>, feedId: string) => {
        e.preventDefault();
        const text = commentInputs[feedId]?.trim();
        if (!text) return;

        setActionLoading(feedId);
        try {
            await feedProvider.createComment(feedId, new FeedCommentBody(text));
            setCommentInputs(prev => ({ ...prev, [feedId]: '' }));
            refreshSingleFeed(feedId);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteComment = async (feedId: string, commentId: string) => {
        setActionLoading(feedId);
        try {
            await feedProvider.deleteComment(commentId);
            refreshSingleFeed(feedId);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const startEditingComment = (commentId: string, currentText: string) => {
        setEditingCommentId(commentId);
        setEditCommentText(currentText);
    };

    const handleUpdateComment = async (feedId: string, commentId: string) => {
        if (!editCommentText.trim()) return;
        setActionLoading(feedId);
        try {
            await feedProvider.updateComment(commentId, new FeedCommentBody(editCommentText));
            setEditingCommentId(null);
            setEditCommentText('');
            refreshSingleFeed(feedId);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateTableComment = async (feedId: string, commentId: string, newText: string) => {
        if (!newText.trim()) return;
        setActionLoading(feedId);
        try {
            await feedProvider.updateComment(commentId, new FeedCommentBody(newText));
            setEditingCommentId(null);
            setEditCommentText('');
            refreshSingleFeed(feedId);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCommentStatusSubmit = async (commentId: string, newStatus: number) => {
        setActionLoading('comment-status');
        try {
            await feedProvider.updateCommentStatus(commentId, new StatusBody(newStatus));
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateReaction = async (reactionId: string, type: number) => {
        setActionLoading('reaction-update');
        try {
            await feedProvider.updateReaction(reactionId, new FeedReactionBody(type));
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReactionStatusSubmit = async (reactionId: string, newStatus: number) => {
        setActionLoading('reaction-status');
        try {
            await feedProvider.updateReactionStatus(reactionId, new StatusBody(newStatus));
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteReaction = async (reactionId: string) => {
        setActionLoading('reaction-delete');
        try {
            await feedProvider.deleteReaction(reactionId);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        actionLoading,
        commentInputs,
        editingCommentId,
        editCommentText,
        setEditCommentText,
        setEditingCommentId,
        handleReaction,
        handleCommentInput,
        handleAddComment,
        handleDeleteComment,
        startEditingComment,
        handleUpdateComment,
        handleUpdateTableComment,
        handleCommentStatusSubmit,
        handleUpdateReaction,
        handleReactionStatusSubmit,
        handleDeleteReaction
    };
}