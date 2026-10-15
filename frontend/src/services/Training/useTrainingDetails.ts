import { useEffect, useState } from 'react';

import { TrainingProvider } from '../../api/providers/TrainingProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { TRAINING_INCLUDES } from '../../api/queries/includes';
import { TrainingFilterQuery } from '../../api/queries/TrainingFilterQuery';
import { TrainingIndexQuery } from '../../api/queries/TrainingIndexQuery';
import { TrainingResponse } from '../../api/responses/TrainingResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { firstOrNotFound } from '../../utils/query';

export function useTrainingDetails(link?: string) {
    const access = useAppAccess();
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const { data: training, loading, error, executeFetch } = useDataFetch<TrainingResponse>();
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);

    const trainingProvider = new TrainingProvider();
    const userProvider = new UserProvider();

    const fetchTrainingData = () => {
        if (!link || !access.currentUser) return;

        executeFetch(async () => {
            const filterDto = new TrainingFilterQuery();
            filterDto.link = link;
            const indexDto = new TrainingIndexQuery();
            indexDto.filter = filterDto;
            indexDto.include = TRAINING_INCLUDES;

            const targetTraining = firstOrNotFound(await trainingProvider.index(indexDto));

            setOwnerUser(await userProvider.details(targetTraining.userId));
            await loadRelatedUsers(targetTraining.participants?.map((p) => p.userId) || []);

            return targetTraining;
        });
    };

    useEffect(() => {
        if (isAccessReady(access)) {
            fetchTrainingData();
        }
    }, [link, access.authLoading, access.authError, access.currentUser]);

    const currentUserId = access.currentUser?.id;

    return {
        ...access,
        ownerUser,
        training,
        relatedUsers,
        isMyProfile: !!training && training.userId === currentUserId,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshTraining: fetchTrainingData,
    };
}
