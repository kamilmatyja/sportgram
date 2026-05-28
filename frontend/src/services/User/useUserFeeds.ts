import React, {useEffect, useState} from 'react';
import {FeedProvider} from '../../api/providers/FeedProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {FeedFilterQuery} from '../../api/queries/FeedFilterQuery';
import {FeedIndexQuery} from '../../api/queries/FeedIndexQuery';
import {fetchRelatedUsersFromIds} from '../../utils/fetchRelatedUsers';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useUserFeeds(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [feeds, setFeeds] = useState<FeedResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new FeedFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const feedProvider = new FeedProvider();

    const extractUserIds = (feedData: FeedResponse[]): Set<string> => {
        const userIds = new Set<string>();
        feedData.forEach(feed => {
            userIds.add(feed.userId);
            feed.comments?.forEach(c => userIds.add(c.userId));
            feed.reactions?.forEach(r => userIds.add(r.userId));
        });
        return userIds;
    };

    const fetchFeeds = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new FeedFilterQuery();
            filterDto.userId = userId;
            filterDto.text = filters.text;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new FeedIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

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

            setFeeds(detailedFeeds);

            const updatedUsers = await fetchRelatedUsersFromIds(extractUserIds(detailedFeeds), relatedUsers, userProvider);
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
    }, [access.authLoading, access.authError, access.targetUser, page, limit, sort, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
        setPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPage(prev => prev + 1);

    const refreshFeeds = () => {
        if (access.targetUser) fetchFeeds(access.targetUser.id);
    };

    return {
        ...access,
        feeds, relatedUsers, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshFeeds
    };
}