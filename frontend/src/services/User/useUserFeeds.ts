import React, {useEffect, useState} from 'react';
import {FeedProvider} from '../../api/providers/FeedProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {FeedFilterQuery} from '../../api/queries/FeedFilterQuery';
import {FeedIndexQuery} from '../../api/queries/FeedIndexQuery';
import {profileAccess} from '../../utils/profileAccess.ts';
import {fetchRelatedUsersFromIds} from '../../utils/fetchRelatedUsers';

export function useUserFeeds(link?: string) {
    const {checkAccess} = profileAccess();

    const [feeds, setFeeds] = useState<FeedResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new FeedFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
        setLoading(true);
        setError(null);
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
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                if (!link) {
                    setError('userNotFound');
                    return;
                }

                const access = await checkAccess({ link }, { requireFriendship: true });

                setCurrentUser(access.currentUser);
                setTargetUser(access.targetUser);
                setIsAdmin(access.isAdmin);
                setIsMyProfile(access.isMyProfile);

                await fetchFeeds(access.targetUser.id);
            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [link, page, limit, sort, filters]);

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
        if (targetUser) fetchFeeds(targetUser.id);
    };

    return {
        feeds, targetUser, currentUser, relatedUsers, isMyProfile, isAdmin, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshFeeds
    };
}