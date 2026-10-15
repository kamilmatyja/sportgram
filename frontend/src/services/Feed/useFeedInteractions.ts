import React, { useState } from 'react';

import { FeedCommentBody } from '../../api/body/FeedCommentBody';
import { FeedReactionBody } from '../../api/body/FeedReactionBody';
import { StatusBody } from '../../api/body/StatusBody';
import { FeedProvider } from '../../api/providers/FeedProvider';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useSafeAction } from '../Common/useSafeAction';

export type FeedInteractions = ReturnType<typeof useFeedInteractions>;

export function useFeedInteractions(
    feeds: FeedResponse[],
    currentUser: UserResponse | null,
    refreshSingleFeed: (feedId: string) => void,
    refreshAfterTableAction?: () => void,
) {
    const { actionLoading, actionError, actionErrorId, runSafeAction } = useSafeAction();

    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState<string>('');

    const feedProvider = new FeedProvider();

    const runFeedAction = (feedId: string, action: () => Promise<unknown>) =>
        runSafeAction(feedId, async () => {
            await action();
            refreshSingleFeed(feedId);
        });

    const runTableAction = (id: string, action: () => Promise<unknown>) =>
        runSafeAction(id, async () => {
            await action();
            refreshAfterTableAction?.();
        });

    const handleReaction = async (feedId: string, reactionType: number): Promise<boolean> => {
        if (!currentUser) return false;
        const feed = feeds.find((f) => f.id === feedId);
        if (!feed) return false;

        const myReaction = feed.reactions?.find((r) => r.userId === currentUser.id);
        return runFeedAction(feedId, () => {
            if (!myReaction) return feedProvider.createReaction(feedId, new FeedReactionBody(reactionType));
            if (myReaction.reaction === reactionType) return feedProvider.deleteReaction(myReaction.id);
            return feedProvider.updateReaction(myReaction.id, new FeedReactionBody(reactionType));
        });
    };

    const handleCommentInput = (feedId: string, value: string) => {
        setCommentInputs((prev) => ({ ...prev, [feedId]: value }));
    };

    const handleAddComment = async (e: React.SyntheticEvent<HTMLFormElement>, feedId: string): Promise<boolean> => {
        e.preventDefault();
        const text = commentInputs[feedId]?.trim();
        if (!text) return false;

        return runFeedAction(feedId, async () => {
            await feedProvider.createComment(feedId, new FeedCommentBody(text));
            setCommentInputs((prev) => ({ ...prev, [feedId]: '' }));
        });
    };

    const handleDeleteComment = (feedId: string, commentId: string) =>
        runFeedAction(feedId, () => feedProvider.deleteComment(commentId));

    const startEditingComment = (commentId: string, currentText: string) => {
        setEditingCommentId(commentId);
        setEditCommentText(currentText);
    };

    const handleUpdateTableComment = async (feedId: string, commentId: string, newText: string): Promise<boolean> => {
        if (!newText.trim()) return false;
        return runFeedAction(feedId, async () => {
            await feedProvider.updateComment(commentId, new FeedCommentBody(newText));
            setEditingCommentId(null);
            setEditCommentText('');
        });
    };

    const handleUpdateComment = (feedId: string, commentId: string) =>
        handleUpdateTableComment(feedId, commentId, editCommentText);

    const handleCommentStatusSubmit = (commentId: string, newStatus: number) =>
        runTableAction('comment-status', () => feedProvider.updateCommentStatus(commentId, new StatusBody(newStatus)));

    const handleUpdateReaction = (reactionId: string, type: number) =>
        runTableAction('reaction-update', () => feedProvider.updateReaction(reactionId, new FeedReactionBody(type)));

    const handleReactionStatusSubmit = (reactionId: string, newStatus: number) =>
        runTableAction('reaction-status', () =>
            feedProvider.updateReactionStatus(reactionId, new StatusBody(newStatus)),
        );

    const handleDeleteReaction = (reactionId: string) =>
        runTableAction('reaction-delete', () => feedProvider.deleteReaction(reactionId));

    return {
        actionLoading,
        actionError,
        actionErrorId,
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
        handleDeleteReaction,
    };
}
