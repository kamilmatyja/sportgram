import {useEffect, useState} from 'react';
import {FeedProvider} from '../../api/providers/FeedProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {FeedIndexQuery} from '../../api/queries/FeedIndexQuery';
import {FeedFilterQuery} from '../../api/queries/FeedFilterQuery';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useFeedInteractions} from '../Feed/useFeedInteractions';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useHomeFeeds(targetUserId?: string) {
    const accessOptions = targetUserId ? { targetId: targetUserId, requireFriendship: true } : {};
    const access = useAppAccess(accessOptions);

    const [feeds, setFeeds] = useState<FeedResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const list = useListFilters(new FeedFilterQuery(), 'createdAt:desc', 20);

    const [hasMore, setHasMore] = useState<boolean>(true);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    const feedProvider = new FeedProvider();
    const userProvider = new UserProvider();

    const extractUserIds = (feedData: FeedResponse[]): string[] => {
        return feedData.flatMap(feed => [
            feed.userId,
            ...(feed.comments?.map(c => c.userId) || []),
            ...(feed.reactions?.map(r => r.userId) || [])
        ]);
    };

    const fetchFeeds = async (pageNumber: number, append: boolean = false) => {
        if (!append) setDataLoading(true);
        else setLoadingMore(true);

        try {
            const indexDto = new FeedIndexQuery();
            indexDto.page = pageNumber;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;

            if (targetUserId) {
                const filter = new FeedFilterQuery();
                filter.userId = targetUserId;
                indexDto.filter = filter;
            }

            const data = await feedProvider.index(indexDto);

            const detailedFeeds = await Promise.all(data.map(f => feedProvider.details(f.id, [
                'feedComments', 'feedReactions', 'eventDisciplineList', 'eventDisciplineResult', 'goal', 'goalParticipantResult', 'training'
            ])));

            setHasMore(data.length === list.limit);

            if (append) {
                setFeeds(prev => [...prev, ...detailedFeeds.filter(df => !prev.some(pf => pf.id === df.id))]);
            } else {
                setFeeds(detailedFeeds);
            }

            const updatedUsers = await fetchRelatedUsers(extractUserIds(detailedFeeds), relatedUsers, userProvider);
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
            list.setPage(1);
            fetchFeeds(1, false);
        }
    }, [access.authLoading, access.authError, targetUserId]);

    const handleLoadMore = () => {
        const nextPage = list.page + 1;
        list.setPage(nextPage);
        fetchFeeds(nextPage, true);
    };

    const refreshSingleFeed = async (feedId: string) => {
        try {
            const updatedFeed = await feedProvider.details(feedId, [
                'feedComments', 'feedReactions', 'eventDisciplineList', 'eventDisciplineResult', 'goal', 'goalParticipantResult', 'training'
            ]);
            setFeeds(prev => prev.map(f => f.id === feedId ? updatedFeed : f));
            const updatedUsers = await fetchRelatedUsers(extractUserIds([updatedFeed]), relatedUsers, userProvider);
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