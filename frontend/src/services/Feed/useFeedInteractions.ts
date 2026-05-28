import {useState} from 'react';
import {FeedProvider} from '../../api/providers/FeedProvider';
import {FeedCommentBody} from '../../api/body/FeedCommentBody';
import {FeedReactionBody} from '../../api/body/FeedReactionBody';
import {StatusBody} from '../../api/body/StatusBody';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {useActionState} from '../../utils/hooks/useActionState';

export function useFeedInteractions(
    feeds: FeedResponse[],
    currentUser: UserResponse | null,
    refreshSingleFeed: (feedId: string) => void
) {
    const { actionLoading, runAction } = useActionState();

    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState<string>('');

    const feedProvider = new FeedProvider();

    const handleReaction = (feedId: string, reactionType: number) => {
        if (!currentUser) return;
        const feed = feeds.find(f => f.id === feedId);
        if (!feed) return;

        runAction(feedId, async () => {
            const myReaction = feed.reactions?.find(r => r.userId === currentUser.id);
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
        }).catch(() => {});
    };

    const handleCommentInput = (feedId: string, value: string) => {
        setCommentInputs(prev => ({...prev, [feedId]: value}));
    };

    const handleAddComment = (e: React.SyntheticEvent<HTMLFormElement>, feedId: string) => {
        e.preventDefault();
        const text = commentInputs[feedId]?.trim();
        if (!text) return;

        runAction(feedId, async () => {
            await feedProvider.createComment(feedId, new FeedCommentBody(text));
            setCommentInputs(prev => ({...prev, [feedId]: ''}));
            refreshSingleFeed(feedId);
        }).catch(() => {});
    };

    const handleDeleteComment = (feedId: string, commentId: string) => {
        runAction(feedId, async () => {
            await feedProvider.deleteComment(commentId);
            refreshSingleFeed(feedId);
        }).catch(() => {});
    };

    const startEditingComment = (commentId: string, currentText: string) => {
        setEditingCommentId(commentId);
        setEditCommentText(currentText);
    };

    const handleUpdateComment = (feedId: string, commentId: string) => {
        if (!editCommentText.trim()) return;
        runAction(feedId, async () => {
            await feedProvider.updateComment(commentId, new FeedCommentBody(editCommentText));
            setEditingCommentId(null);
            setEditCommentText('');
            refreshSingleFeed(feedId);
        }).catch(() => {});
    };

    const handleUpdateTableComment = (feedId: string, commentId: string, newText: string) => {
        if (!newText.trim()) return;
        runAction(feedId, async () => {
            await feedProvider.updateComment(commentId, new FeedCommentBody(newText));
            setEditingCommentId(null);
            setEditCommentText('');
            refreshSingleFeed(feedId);
        }).catch(() => {});
    };

    const handleCommentStatusSubmit = (commentId: string, newStatus: number) => {
        runAction('comment-status', async () => {
            await feedProvider.updateCommentStatus(commentId, new StatusBody(newStatus));
        }).catch(() => {});
    };

    const handleUpdateReaction = (reactionId: string, type: number) => {
        runAction('reaction-update', async () => {
            await feedProvider.updateReaction(reactionId, new FeedReactionBody(type));
        }).catch(() => {});
    };

    const handleReactionStatusSubmit = (reactionId: string, newStatus: number) => {
        runAction('reaction-status', async () => {
            await feedProvider.updateReactionStatus(reactionId, new StatusBody(newStatus));
        }).catch(() => {});
    };

    const handleDeleteReaction = (reactionId: string) => {
        runAction('reaction-delete', async () => {
            await feedProvider.deleteReaction(reactionId);
        }).catch(() => {});
    };

    return {
        actionLoading, commentInputs, editingCommentId, editCommentText,
        setEditCommentText, setEditingCommentId, handleReaction, handleCommentInput,
        handleAddComment, handleDeleteComment, startEditingComment, handleUpdateComment,
        handleUpdateTableComment, handleCommentStatusSubmit, handleUpdateReaction,
        handleReactionStatusSubmit, handleDeleteReaction
    };
}