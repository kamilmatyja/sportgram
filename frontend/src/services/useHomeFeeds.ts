import React, {useEffect, useState} from 'react';
import {FeedProvider} from '../api/providers/FeedProvider';
import {UserProvider} from '../api/providers/UserProvider';
import {FeedResponse} from '../api/responses/FeedResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {FeedIndexQuery} from '../api/queries/FeedIndexQuery';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {FeedCommentBody} from '../api/body/FeedCommentBody';
import {FeedReactionBody} from '../api/body/FeedReactionBody';
import {useCheckPermission} from '../utils/checkPermission';
import {FeedFilterQuery} from '../api/queries/FeedFilterQuery';

export function useHomeFeeds(targetUserId?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [feeds, setFeeds] = useState<FeedResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(20);
    const [hasMore, setHasMore] = useState<boolean>(true);

    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState<string>('');

    const feedProvider = new FeedProvider();
    const userProvider = new UserProvider();

    const fetchRelatedUsers = async (feedData: FeedResponse[], currentMap: Record<string, UserResponse>) => {
        const userIds = new Set<string>();

        feedData.forEach(feed => {
            if (!currentMap[feed.userId]) userIds.add(feed.userId);
            feed.comments?.forEach(c => {
                if (!currentMap[c.userId]) userIds.add(c.userId);
            });
            feed.reactions?.forEach(r => {
                if (!currentMap[r.userId]) userIds.add(r.userId);
            });
        });

        const idsArray = Array.from(userIds);
        if (idsArray.length === 0) return currentMap;

        const uFilter = new UserFilterQuery();
        uFilter.userIds = idsArray;
        const uIndexDto = new UserIndexQuery();
        uIndexDto.filter = uFilter;
        uIndexDto.limit = idsArray.length;

        const usersData = await userProvider.index(uIndexDto);

        const newMap = {...currentMap};
        usersData.forEach(u => {
            newMap[u.id] = u;
        });

        return newMap;
    };

    const fetchFeeds = async (pageNumber: number, append: boolean = false) => {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        try {
            const indexDto = new FeedIndexQuery();
            indexDto.page = pageNumber;
            indexDto.limit = limit;
            indexDto.sort = 'createdAt:desc';

            if (targetUserId) {
                const filter = new FeedFilterQuery();
                filter.userId = targetUserId;
                indexDto.filter = filter;
            }

            const data = await feedProvider.index(indexDto);

            const detailedFeeds = await Promise.all(data.map(async (feed) => {
                return await feedProvider.details(feed.id, [
                    'feedComments',
                    'feedReactions',
                    'eventDisciplineList',
                    'eventDisciplineResult',
                    'goal',
                    'goalParticipantResult',
                    'training'
                ]);
            }));

            setHasMore(data.length === limit);

            if (append) {
                setFeeds(prev => {
                    const newFeeds = detailedFeeds.filter(df => !prev.some(pf => pf.id === df.id));
                    return [...prev, ...newFeeds];
                });
                const updatedUsers = await fetchRelatedUsers(detailedFeeds, relatedUsers);
                setRelatedUsers(updatedUsers);
            } else {
                setFeeds(detailedFeeds);
                const updatedUsers = await fetchRelatedUsers(detailedFeeds, {});
                setRelatedUsers(updatedUsers);
            }
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const user = await getCurrentUser();
            if (user) {
                setCurrentUser(user);
                setPage(1);
                await fetchFeeds(1, false);
            }
        };
        init();
    }, [targetUserId]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFeeds(nextPage, true);
    };

    const refreshSingleFeed = async (feedId: string) => {
        try {
            const updatedFeed = await feedProvider.details(feedId, [
                'feedComments',
                'feedReactions',
                'eventDisciplineList',
                'eventDisciplineResult',
                'goal',
                'goalParticipantResult',
                'training'
            ]);

            setFeeds(prev => prev.map(f => f.id === feedId ? updatedFeed : f));

            const updatedUsers = await fetchRelatedUsers([updatedFeed], relatedUsers);
            setRelatedUsers(updatedUsers);
        } catch (e) {
            console.error(e);
        }
    };

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
            await refreshSingleFeed(feedId);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCommentInput = (feedId: string, value: string) => {
        setCommentInputs(prev => ({...prev, [feedId]: value}));
    };

    const handleAddComment = async (e: React.SyntheticEvent<HTMLFormElement>, feedId: string) => {
        e.preventDefault();
        const text = commentInputs[feedId]?.trim();
        if (!text) return;

        setActionLoading(feedId);
        try {
            await feedProvider.createComment(feedId, new FeedCommentBody(text));
            setCommentInputs(prev => ({...prev, [feedId]: ''}));
            await refreshSingleFeed(feedId);
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
            await refreshSingleFeed(feedId);
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
            await refreshSingleFeed(feedId);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        feeds,
        relatedUsers,
        currentUser,
        loading,
        loadingMore,
        hasMore,
        actionLoading,
        commentInputs,
        editingCommentId,
        editCommentText,
        setEditCommentText,
        setEditingCommentId,
        handleLoadMore,
        handleReaction,
        handleCommentInput,
        handleAddComment,
        handleDeleteComment,
        startEditingComment,
        handleUpdateComment
    };
}