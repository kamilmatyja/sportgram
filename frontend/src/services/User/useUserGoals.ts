import React, {useEffect, useState} from 'react';
import {GoalProvider} from '../../api/providers/GoalProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {GoalFilterQuery} from '../../api/queries/GoalFilterQuery';
import {GoalIndexQuery} from '../../api/queries/GoalIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';

export function useUserGoals(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [goals, setGoals] = useState<GoalResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new GoalFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const goalProvider = new GoalProvider();

    const fetchGoals = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new GoalFilterQuery();
            filterDto.userId = userId;
            filterDto.text = filters.text;
            filterDto.discipline = filters.discipline ? Number(filters.discipline) : undefined;
            filterDto.distance = filters.distance ? Number(filters.distance) : undefined;
            filterDto.time = filters.time ? Number(filters.time) : undefined;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new GoalIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await goalProvider.index(indexDto);

            const detailedGoals = await Promise.all(data.map(async (goal) => {
                return await goalProvider.details(goal.id, [
                    'goalParticipants',
                    'goalParticipantResults'
                ]);
            }));

            setGoals(detailedGoals);

            const userIds = detailedGoals.flatMap(g => g.participants.map(p => p.userId));
            const updatedUsers = await fetchRelatedUsers(userIds, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchGoals(access.targetUser.id);
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

    const refreshGoals = () => {
        if (access.targetUser) fetchGoals(access.targetUser.id);
    };

    return {
        ...access,
        goals, relatedUsers, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshGoals
    };
}