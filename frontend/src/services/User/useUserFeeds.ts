import { useEffect, useState } from 'react';
import { UserProvider } from '../../api/providers/UserProvider';
import { FeedProvider } from '../../api/providers/FeedProvider';
import { FriendProvider } from '../../api/providers/FriendProvider';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { FeedFilterQuery } from '../../api/queries/FeedFilterQuery';
import { FeedIndexQuery } from '../../api/queries/FeedIndexQuery';
import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { UserIndexQuery } from '../../api/queries/UserIndexQuery';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../../api/queries/FriendIndexQuery';
import { useCheckPermission } from '../../utils/checkPermission';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { fetchRelatedUsersFromIds } from '../../utils/fetchRelatedUsers';

export function useUserFeeds(link?: string) {
    const { getCurrentUser } = useCheckPermission();

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
    const friendProvider = new FriendProvider();

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
        const checkAccessAndFetch = async () => {
            try {
                setLoading(true);
                const currentUsr = await getCurrentUser();
                setCurrentUser(currentUsr);

                if (!currentUsr || !link) {
                    setError('unauthorizedEdit');
                    return;
                }

                const adminCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
                setIsAdmin(adminCheck);

                const uFilter = new UserFilterQuery();
                uFilter.link = link;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                const targetUsers = await userProvider.index(uIndexDto);

                if (targetUsers.length === 0) {
                    setError('userNotFound');
                    return;
                }

                const tUser = targetUsers[0];
                const fullTargetUser = await userProvider.details(tUser.id, ['userRoles', 'userDisciplines']);
                setTargetUser(fullTargetUser);

                const isOwner = currentUsr.id === tUser.id;
                setIsMyProfile(isOwner);

                if (!isOwner && !adminCheck) {
                    const fFilter = new FriendFilterQuery();
                    fFilter.status = FriendStatusEnum.ACCEPTED;
                    fFilter.userIds = [tUser.id, currentUsr.id];
                    const fIndexDto = new FriendIndexQuery();
                    fIndexDto.filter = fFilter;
                    const friends = await friendProvider.index(fIndexDto);

                    if (friends.length < 1) {
                        setError('accessDenied');
                        setLoading(false);
                        return;
                    }
                }

                await fetchFeeds(tUser.id);
            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        checkAccessAndFetch();
    }, [link, page, limit, sort, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
        feeds,
        targetUser,
        currentUser,
        relatedUsers,
        isMyProfile,
        isAdmin,
        page,
        limit,
        sort,
        filters,
        loading,
        error,
        handleFilterChange,
        handleSortChange,
        handleLimitChange,
        handlePrevPage,
        handleNextPage,
        refreshFeeds
    };
}