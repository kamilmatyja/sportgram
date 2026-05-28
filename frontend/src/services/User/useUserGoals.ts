import {useEffect, useState} from 'react';
import {GoalProvider} from '../../api/providers/GoalProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {GoalFilterQuery} from '../../api/queries/GoalFilterQuery';
import {GoalIndexQuery} from '../../api/queries/GoalIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useUserGoals(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [goals, setGoals] = useState<GoalResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new GoalFilterQuery());

    const userProvider = new UserProvider();
    const goalProvider = new GoalProvider();

    const fetchGoals = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new GoalFilterQuery();
            filterDto.userId = userId;
            filterDto.text = list.filters.text;
            filterDto.discipline = list.filters.discipline ? Number(list.filters.discipline) : undefined;
            filterDto.distance = list.filters.distance ? Number(list.filters.distance) : undefined;
            filterDto.time = list.filters.time ? Number(list.filters.time) : undefined;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new GoalIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await goalProvider.index(indexDto);

            const detailedGoals = await Promise.all(data.map(async (goal) => {
                return await goalProvider.details(goal.id, ['goalParticipants', 'goalParticipantResults']);
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
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshGoals = () => {
        if (access.targetUser) fetchGoals(access.targetUser.id);
    };

    return {
        ...access,
        ...list,
        goals, relatedUsers,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshGoals
    };
}