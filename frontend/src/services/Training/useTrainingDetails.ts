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

export function useTrainingDetails(link?: string) {
    const access = useAppAccess();

    const { data: training, loading, error, executeFetch } = useDataFetch<TrainingResponse>();
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [isParticipantOfTraining, setIsParticipantOfTraining] = useState<boolean>(false);
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

    const trainingProvider = new TrainingProvider();
    const userProvider = new UserProvider();

    const fetchTrainingData = () => {
        if (!link || !access.currentUser) return;

        executeFetch(
            async () => {
                const filterDto = new TrainingFilterQuery();
                filterDto.link = link;
                const indexDto = new TrainingIndexQuery();
                indexDto.filter = filterDto;
                indexDto.include = [
                    'trainingDisciplines',
                    'trainingDisciplineDistances',
                    'trainingDisciplineSubDistances',
                    'trainingParticipants',
                ];

                const trainings = await trainingProvider.index(indexDto);
                if (trainings.length === 0) {
                    throw { error: 'noRecords' };
                }

                const targetTraining = trainings[0];

                const owner = await userProvider.details(targetTraining.userId);
                setOwnerUser(owner);
                setIsMyProfile(access.currentUser!.id === owner.id);

                const participantCheck =
                    targetTraining.participants?.some((p) => p.userId === access.currentUser!.id) ?? false;
                setIsParticipantOfTraining(participantCheck);

                const userIds = targetTraining.participants?.map((p) => p.userId) || [];
                const updatedUsers = await fetchRelatedUsers(userIds, relatedUsers, userProvider);
                setRelatedUsers(updatedUsers);

                return targetTraining;
            },
            null as unknown as TrainingResponse,
        );
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.currentUser) {
            fetchTrainingData();
        }
    }, [link, access.authLoading, access.authError, access.currentUser]);

    const refreshTraining = () => fetchTrainingData();

    return {
        ...access,
        ownerUser,
        training,
        relatedUsers,
        isParticipantOfTraining,
        isMyProfile,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshTraining,
    };
}
