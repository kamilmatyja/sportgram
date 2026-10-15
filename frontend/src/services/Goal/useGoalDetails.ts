import { useEffect, useState } from 'react';

import { GoalProvider } from '../../api/providers/GoalProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { GoalFilterQuery } from '../../api/queries/GoalFilterQuery';
import { GoalIndexQuery } from '../../api/queries/GoalIndexQuery';
import { GOAL_INCLUDES } from '../../api/queries/includes';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { firstOrNotFound } from '../../utils/query';

export function useGoalDetails(link?: string) {
    const access = useAppAccess();
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const { data: goal, loading, error, executeFetch } = useDataFetch<GoalResponse>();
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);

    const goalProvider = new GoalProvider();
    const userProvider = new UserProvider();

    const fetchGoalData = () => {
        if (!link || !access.currentUser) return;

        executeFetch(async () => {
            const filterDto = new GoalFilterQuery();
            filterDto.link = link;
            const indexDto = new GoalIndexQuery();
            indexDto.filter = filterDto;
            indexDto.include = GOAL_INCLUDES;

            const targetGoal = firstOrNotFound(await goalProvider.index(indexDto));

            setOwnerUser(await userProvider.details(targetGoal.userId));
            await loadRelatedUsers(targetGoal.participants.map((p) => p.userId));

            return targetGoal;
        });
    };

    useEffect(() => {
        if (isAccessReady(access)) {
            fetchGoalData();
        }
    }, [link, access.authLoading, access.authError]);

    const currentUserId = access.currentUser?.id;

    return {
        ...access,
        ownerUser,
        goal,
        relatedUsers,
        isMyProfile: !!goal && goal.userId === currentUserId,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshGoal: fetchGoalData,
    };
}
