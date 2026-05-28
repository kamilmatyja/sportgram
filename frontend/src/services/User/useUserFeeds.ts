import {useEffect, useState} from 'react';
import {FeedProvider} from '../../api/providers/FeedProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {FeedFilterQuery} from '../../api/queries/FeedFilterQuery';
import {FeedIndexQuery} from '../../api/queries/FeedIndexQuery';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';
import {useDataFetch} from '../../utils/hooks/useDataFetch';

export function useUserFeeds(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const list = useListFilters(new FeedFilterQuery());
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const { data: feeds, loading, error, executeFetch } = useDataFetch<FeedResponse[]>();

    const userProvider = new UserProvider();
    const feedProvider = new FeedProvider();

    const extractUserIds = (feedData: FeedResponse[]): string[] => {
        return feedData.flatMap(feed => [
            feed.userId,
            ...(feed.comments?.map(c => c.userId) || []),
            ...(feed.reactions?.map(r => r.userId) || [])
        ]);
    };

    const fetchFeeds = (userId: string) => {
        executeFetch(async () => {
            const filterDto = new FeedFilterQuery();
            filterDto.userId = userId;
            filterDto.text = list.filters.text;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new FeedIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await feedProvider.index(indexDto);

            const detailedFeeds = await Promise.all(data.map(async (feed) => {
                return await feedProvider.details(feed.id, [
                    'feedComments', 'feedReactions', 'eventDisciplineList', 'eventDisciplineResult', 'goal', 'goalParticipantResult', 'training'
                ]);
            }));

            const updatedUsers = await fetchRelatedUsers(extractUserIds(detailedFeeds), relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

            return detailedFeeds;
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchFeeds(access.targetUser.id);
        }
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshFeeds = () => {
        if (access.targetUser) fetchFeeds(access.targetUser.id);
    };

    return {
        ...access,
        ...list,
        feeds: feeds || [],
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshFeeds
    };
}