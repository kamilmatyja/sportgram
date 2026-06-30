import { useEffect, useState } from 'react';

import { TrainingProvider } from '../../api/providers/TrainingProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { TrainingFilterQuery } from '../../api/queries/TrainingFilterQuery';
import { TrainingIndexQuery } from '../../api/queries/TrainingIndexQuery';
import { TrainingResponse } from '../../api/responses/TrainingResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { fetchRelatedUsers } from '../../utils/fetchRelatedUsers';
import { useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useListFilters } from '../../utils/hooks/useListFilters';

export function useUserTrainings(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const list = useListFilters(new TrainingFilterQuery());

    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const { data: trainings, loading, error, executeFetch } = useDataFetch<TrainingResponse[]>();

    const userProvider = new UserProvider();
    const trainingProvider = new TrainingProvider();

    const fetchTrainings = (userId: string) => {
        executeFetch(async () => {
            const filterDto = new TrainingFilterQuery();
            filterDto.userId = userId;
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new TrainingIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;
            indexDto.include = [
                'trainingDisciplines',
                'trainingDisciplineDistances',
                'trainingDisciplineSubDistances',
                'trainingParticipants',
            ];

            const data = await trainingProvider.index(indexDto);

            const userIds = data.flatMap((t) => t.participants.map((p) => p.userId));
            const updatedUsers = await fetchRelatedUsers(userIds, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

            return data;
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchTrainings(access.targetUser.id);
        }
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshTrainings = () => {
        if (access.targetUser) fetchTrainings(access.targetUser.id);
    };

    return {
        ...access,
        ...list,
        trainings: trainings || [],
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshTrainings,
    };
}
