import { TrainingProvider } from '../../api/providers/TrainingProvider';
import { TRAINING_INCLUDES } from '../../api/queries/includes';
import { TrainingFilterQuery } from '../../api/queries/TrainingFilterQuery';
import { TrainingIndexQuery } from '../../api/queries/TrainingIndexQuery';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { toOptionalNumber } from '../../utils/query';

export function useUserTrainings(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const trainingProvider = new TrainingProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new TrainingFilterQuery(),
        scope: isAccessReady(access) ? access.targetUser : null,
        fetchPage: async (list, targetUser) => {
            const filterDto = new TrainingFilterQuery();
            filterDto.userId = targetUser.id;
            filterDto.title = list.filters.title;
            filterDto.status = toOptionalNumber(list.filters.status);

            const indexDto = list.buildIndexQuery(new TrainingIndexQuery(), filterDto);
            indexDto.include = TRAINING_INCLUDES;

            const data = list.applyPagination(await trainingProvider.index(indexDto));
            await loadRelatedUsers(data.flatMap((t) => t.participants.map((p) => p.userId)));

            return data;
        },
    });

    return {
        ...access,
        ...list,
        trainings: items,
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshTrainings: refresh,
    };
}
