import React, {useEffect, useState} from 'react';
import {useCheckPermission} from '../utils/checkPermission';
import {StatisticProvider} from '../api/providers/StatisticProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {UserProvider} from '../api/providers/UserProvider';
import {StatisticFilterQuery} from '../api/queries/StatisticFilterQuery';
import {StatisticIndexQuery} from '../api/queries/StatisticIndexQuery';
import {FriendFilterQuery} from '../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {StatisticResponse} from '../api/responses/StatisticResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';

export function useStatistics() {
    const {getCurrentUser} = useCheckPermission();

    const statisticProvider = new StatisticProvider();
    const friendProvider = new FriendProvider();
    const userProvider = new UserProvider();

    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

    const [activeTab, setActiveTab] = useState<'records' | 'progress'>('records');
    const [data, setData] = useState<StatisticResponse[]>([]);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState<StatisticFilterQuery>(new StatisticFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadAvailableUsers = async (currentUsr: UserResponse) => {
        const fFilter = new FriendFilterQuery();
        fFilter.userIds = [currentUsr.id];
        fFilter.status = FriendStatusEnum.ACCEPTED;
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilter;
        fIndexDto.limit = 100;

        const myFriends = await friendProvider.index(fIndexDto);

        const acceptedFriendIds = new Set<string>();
        myFriends.forEach(f => {
            if (f.senderUserId !== currentUsr.id) acceptedFriendIds.add(f.senderUserId);
            if (f.receiverUserId !== currentUsr.id) acceptedFriendIds.add(f.receiverUserId);
        });

        const usersList: UserResponse[] = [currentUsr];

        if (acceptedFriendIds.size > 0) {
            const uFilter = new UserFilterQuery();
            uFilter.userIds = Array.from(acceptedFriendIds);
            const uIndexDto = new UserIndexQuery();
            uIndexDto.filter = uFilter;
            uIndexDto.limit = 100;
            const acceptedFriendsUsers = await userProvider.index(uIndexDto);
            usersList.push(...acceptedFriendsUsers);
        }

        setAvailableUsers(usersList);

        if (!filters.userIds || filters.userIds.length === 0) {
            setFilters(prev => ({...prev, userIds: [currentUsr.id]}));
        }
    };

    const fetchStatistics = async () => {
        if (!filters.userIds || filters.userIds.length === 0) return;

        setLoading(true);
        setError(null);
        try {
            const filterDto = new StatisticFilterQuery();
            filterDto.userIds = filters.userIds;
            filterDto.discipline = filters.discipline ? Number(filters.discipline) : undefined;
            filterDto.distance = filters.distance ? Number(filters.distance) : undefined;

            const indexDto = new StatisticIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            let responseData: StatisticResponse[] = [];
            if (activeTab === 'records') {
                responseData = await statisticProvider.indexRecords(indexDto);
            } else {
                responseData = await statisticProvider.indexProgress(indexDto);
            }

            setData(responseData);
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
                const currentUsr = await getCurrentUser();
                if (!currentUsr) {
                    setError('accessDenied');
                    setLoading(false);
                    return;
                }
                setCurrentUser(currentUsr);
                await loadAvailableUsers(currentUsr);
            } catch (err: any) {
                setError(err.error);
                setLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (currentUser && filters.userIds && filters.userIds.length > 0) {
            fetchStatistics();
        }
    }, [currentUser, activeTab, page, limit, sort, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
        setPage(1);
    };

    const handleUsersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        if (selected.length === 0 && currentUser) {
            setFilters(prev => ({...prev, userIds: [currentUser.id]}));
        } else {
            setFilters(prev => ({...prev, userIds: selected}));
        }
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

    return {
        currentUser, availableUsers, activeTab, setActiveTab, data, page, limit, sort, filters, loading, error,
        handleFilterChange, handleUsersChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage
    };
}