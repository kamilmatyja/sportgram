import { GoalProvider } from '../../api/providers/GoalProvider';
import { GoalFilterQuery } from '../../api/queries/GoalFilterQuery';
import { GoalIndexQuery } from '../../api/queries/GoalIndexQuery';
import { GOAL_INCLUDES } from '../../api/queries/includes';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { toOptionalNumber } from '../../utils/query';

export function useUserGoals(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const goalProvider = new GoalProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new GoalFilterQuery(),
        scope: isAccessReady(access) ? access.targetUser : null,
        fetchPage: async (list, targetUser) => {
            const filterDto = new GoalFilterQuery();
            filterDto.userId = targetUser.id;
            filterDto.text = list.filters.text;
            filterDto.discipline = toOptionalNumber(list.filters.discipline);
            filterDto.status = toOptionalNumber(list.filters.status);

            const indexDto = list.buildIndexQuery(new GoalIndexQuery(), filterDto);
            indexDto.include = GOAL_INCLUDES;

            const data = list.applyPagination(await goalProvider.index(indexDto));
            await loadRelatedUsers(data.flatMap((g) => g.participants.map((p) => p.userId)));

            return data;
        },
    });

    return {
        ...access,
        ...list,
        goals: items,
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshGoals: refresh,
    };
}
