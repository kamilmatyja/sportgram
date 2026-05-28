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

export function useUserFeeds(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [feeds, setFeeds] = useState<FeedResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new FeedFilterQuery());

    const userProvider = new UserProvider();
    const feedProvider = new FeedProvider();

    const extractUserIds = (feedData: FeedResponse[]): string[] => {
        return feedData.flatMap(feed => [
            feed.userId,
            ...(feed.comments?.map(c => c.userId) || []),
            ...(feed.reactions?.map(r => r.userId) || [])
        ]);
    };

    const fetchFeeds = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
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

            setFeeds(detailedFeeds);

            const updatedUsers = await fetchRelatedUsers(extractUserIds(detailedFeeds), relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
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
        feeds, relatedUsers,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshFeeds
    };
}