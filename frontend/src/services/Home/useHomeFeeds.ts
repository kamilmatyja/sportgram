import {useEffect, useState} from 'react';
import {FeedProvider} from '../../api/providers/FeedProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {FeedIndexQuery} from '../../api/queries/FeedIndexQuery';
import {FeedFilterQuery} from '../../api/queries/FeedFilterQuery';
import {fetchRelatedUsersFromIds} from '../../utils/fetchRelatedUsers';
import {useFeedInteractions} from '../Feed/useFeedInteractions';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useHomeFeeds(targetUserId?: string) {
    const accessOptions = targetUserId ? { targetId: targetUserId, requireFriendship: true } : {};
    const access = useAppAccess(accessOptions);

    const [feeds, setFeeds] = useState<FeedResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(20);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    const feedProvider = new FeedProvider();
    const userProvider = new UserProvider();

    const extractUserIds = (feedData: FeedResponse[]): Set<string> => {
        const userIds = new Set<string>();
        feedData.forEach(feed => {
            userIds.add(feed.userId);
            feed.comments?.forEach(c => userIds.add(c.userId));
            feed.reactions?.forEach(r => userIds.add(r.userId));
        });
        return userIds;
    };

    const fetchFeeds = async (pageNumber: number, append: boolean = false) => {
        if (!append) setDataLoading(true);
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

            const detailedFeeds = await Promise.all(data.map(f => feedProvider.details(f.id, [
                'feedComments', 'feedReactions', 'eventDisciplineList', 'eventDisciplineResult', 'goal', 'goalParticipantResult', 'training'
            ])));

            setHasMore(data.length === limit);

            if (append) {
                setFeeds(prev => [...prev, ...detailedFeeds.filter(df => !prev.some(pf => pf.id === df.id))]);
            } else {
                setFeeds(detailedFeeds);
            }

            const updatedUsers = await fetchRelatedUsersFromIds(extractUserIds(detailedFeeds), relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);
        } catch (err) {
            console.error(err);
        } finally {
            setDataLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.currentUser) {
            setPage(1);
            fetchFeeds(1, false);
        }
    }, [access.authLoading, access.authError, targetUserId]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFeeds(nextPage, true);
    };

    const refreshSingleFeed = async (feedId: string) => {
        try {
            const updatedFeed = await feedProvider.details(feedId, [
                'feedComments', 'feedReactions', 'eventDisciplineList', 'eventDisciplineResult', 'goal', 'goalParticipantResult', 'training'
            ]);
            setFeeds(prev => prev.map(f => f.id === feedId ? updatedFeed : f));
            const updatedUsers = await fetchRelatedUsersFromIds(extractUserIds([updatedFeed]), relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);
        } catch (e) {
            console.error(e);
        }
    };

    const interactions = useFeedInteractions(feeds, access.currentUser, refreshSingleFeed);

    return {
        ...access,
        feeds,
        relatedUsers,
        loading: access.authLoading || dataLoading,
        loadingMore,
        hasMore,
        handleLoadMore,
        ...interactions
    };
}