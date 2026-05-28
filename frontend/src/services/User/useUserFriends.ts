import React, {useEffect, useState} from 'react';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FriendIndexQuery} from '../../api/queries/FriendIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {FriendFilterQuery} from '../../api/queries/FriendFilterQuery';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useUserFriends(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [friends, setFriends] = useState<FriendResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new FriendFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const fetchFriends = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new FriendFilterQuery();
            filterDto.userIds = [userId];
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new FriendIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await friendProvider.index(indexDto);
            setFriends(data);

            const userIdsToFetch = Array.from(
                new Set(data.flatMap(f => [f.senderUserId, f.receiverUserId]))
            );

            if (userIdsToFetch.length > 0) {
                const uFilter = new UserFilterQuery();
                uFilter.userIds = userIdsToFetch;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                uIndexDto.limit = userIdsToFetch.length;

                const usersData = await userProvider.index(uIndexDto);

                const usersMap = usersData.reduce((acc, curr) => {
                    acc[curr.id] = curr;
                    return acc;
                }, {} as Record<string, UserResponse>);

                setRelatedUsers(usersMap);
            } else {
                setRelatedUsers({});
            }

        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchFriends(access.targetUser.id);
        }
    }, [access.authLoading, access.authError, access.targetUser, page, limit, sort, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

    const refreshFriends = () => {
        if (access.targetUser) fetchFriends(access.targetUser.id);
    };

    return {
        ...access,
        friends, relatedUsers, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshFriends
    };
}