import React, { useEffect, useState } from 'react';

import { StatisticProvider } from '../../api/providers/StatisticProvider';
import { StatisticFilterQuery } from '../../api/queries/StatisticFilterQuery';
import { StatisticIndexQuery } from '../../api/queries/StatisticIndexQuery';
import { UserResponse } from '../../api/responses/UserResponse';
import { getErrorMessage } from '../../utils/api';
import { fetchAcceptedFriendIds } from '../../utils/fetchFriends';
import { fetchRelatedUsers } from '../../utils/fetchRelatedUsers';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { toOptionalNumber } from '../../utils/query';

const selectedUserIds = (filters: StatisticFilterQuery, currentUser: UserResponse | null) =>
    filters.userIds?.length ? filters.userIds : currentUser ? [currentUser.id] : [];

export function useStatistics() {
    const access = useAppAccess();
    const statisticProvider = new StatisticProvider();

    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'records' | 'progress'>('records');

    const { list, items, loading, error } = usePaginatedList({
        initialFilter: new StatisticFilterQuery(),
        scope: isAccessReady(access) ? access.currentUser : null,
        deps: [activeTab],
        fetchPage: async (list, currentUser) => {
            const filterDto = new StatisticFilterQuery();
            filterDto.userIds = selectedUserIds(list.filters, currentUser);
            filterDto.discipline = toOptionalNumber(list.filters.discipline);
            filterDto.distance = toOptionalNumber(list.filters.distance);

            const indexDto = list.buildIndexQuery(new StatisticIndexQuery(), filterDto);
            const response =
                activeTab === 'records'
                    ? await statisticProvider.indexRecords(indexDto)
                    : await statisticProvider.indexProgress(indexDto);

            return list.applyPagination(response);
        },
    });

    useEffect(() => {
        const currentUser = access.currentUser;
        if (!isAccessReady(access) || !currentUser) return;

        setUsersError(null);
        fetchAcceptedFriendIds(currentUser.id)
            .then((friendIds) => fetchRelatedUsers(friendIds))
            .then((friends) => setAvailableUsers([currentUser, ...Object.values(friends)]))
            .catch((err) => {
                setAvailableUsers([currentUser]);
                setUsersError(getErrorMessage(err));
            });
    }, [access.authLoading, access.currentUser]);

    const handleUsersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userIds = Array.from(e.target.selectedOptions).map((o) => o.value);
        list.setFilters((prev) => ({ ...prev, userIds }));
        list.setPage(1);
    };

    return {
        ...access,
        ...list,
        filters: { ...list.filters, userIds: selectedUserIds(list.filters, access.currentUser) },
        availableUsers,
        usersError,
        activeTab,
        setActiveTab,
        data: items,
        loading: access.authLoading || loading,
        error: access.authError || error,
        handleUsersChange,
    };
}
