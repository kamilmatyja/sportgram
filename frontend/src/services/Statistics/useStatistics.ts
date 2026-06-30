import { useEffect, useState } from 'react';

import { FriendProvider } from '../../api/providers/FriendProvider';
import { StatisticProvider } from '../../api/providers/StatisticProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../../api/queries/FriendIndexQuery';
import { StatisticFilterQuery } from '../../api/queries/StatisticFilterQuery';
import { StatisticIndexQuery } from '../../api/queries/StatisticIndexQuery';
import { StatisticResponse } from '../../api/responses/StatisticResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { fetchRelatedUsers } from '../../utils/fetchRelatedUsers';
import { useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useListFilters } from '../../utils/hooks/useListFilters';

export function useStatistics() {
    const access = useAppAccess();
    const statisticProvider = new StatisticProvider();
    const friendProvider = new FriendProvider();
    const userProvider = new UserProvider();

    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
    const [activeTab, setActiveTab] = useState<'records' | 'progress'>('records');

    const list = useListFilters(new StatisticFilterQuery());
    const { data, loading, error, executeFetch } = useDataFetch<StatisticResponse[]>();

    const loadAvailableUsers = async (currentUsr: UserResponse) => {
        const fFilter = new FriendFilterQuery();
        fFilter.userIds = [currentUsr.id];
        fFilter.status = FriendStatusEnum.ACCEPTED;
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilter;
        fIndexDto.limit = 100;

        const myFriends = await friendProvider.index(fIndexDto);

        const acceptedFriendIds = new Set<string>();
        myFriends.forEach((f) => {
            if (f.senderUserId !== currentUsr.id) acceptedFriendIds.add(f.senderUserId);
            if (f.receiverUserId !== currentUsr.id) acceptedFriendIds.add(f.receiverUserId);
        });

        const usersList: UserResponse[] = [currentUsr];

        if (acceptedFriendIds.size > 0) {
            const usersMap = await fetchRelatedUsers(Array.from(acceptedFriendIds), {}, userProvider);
            usersList.push(...Object.values(usersMap));
        }

        setAvailableUsers(usersList);

        if (!list.filters.userIds || list.filters.userIds.length === 0) {
            list.setFilters((prev) => ({ ...prev, userIds: [currentUsr.id] }));
        }
    };

    const fetchStatistics = () => {
        if (!list.filters.userIds || list.filters.userIds.length === 0) return;

        executeFetch(async () => {
            const filterDto = new StatisticFilterQuery();
            filterDto.userIds = list.filters.userIds;
            filterDto.discipline = list.filters.discipline ? Number(list.filters.discipline) : undefined;
            filterDto.distance = list.filters.distance ? Number(list.filters.distance) : undefined;

            const indexDto = new StatisticIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            if (activeTab === 'records') {
                return await statisticProvider.indexRecords(indexDto);
            } else {
                return await statisticProvider.indexProgress(indexDto);
            }
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && access.currentUser && !access.authError) {
            loadAvailableUsers(access.currentUser);
        }
    }, [access.authLoading, access.currentUser]);

    useEffect(() => {
        if (access.currentUser && list.filters.userIds && list.filters.userIds.length > 0) {
            fetchStatistics();
        }
    }, [access.currentUser, activeTab, list.page, list.limit, list.sort, list.filters]);

    const handleUsersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
        if (selected.length === 0 && access.currentUser) {
            list.setFilters((prev) => ({ ...prev, userIds: [access.currentUser!.id] }));
        } else {
            list.setFilters((prev) => ({ ...prev, userIds: selected }));
        }
        list.setPage(1);
    };

    return {
        ...access,
        ...list,
        availableUsers,
        activeTab,
        setActiveTab,
        data: data || [],
        loading: access.authLoading || loading,
        error: access.authError || error,
        handleUsersChange,
    };
}
