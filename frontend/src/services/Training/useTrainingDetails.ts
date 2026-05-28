import {useEffect, useState} from 'react';
import {TrainingProvider} from '../../api/providers/TrainingProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {TrainingFilterQuery} from '../../api/queries/TrainingFilterQuery';
import {TrainingIndexQuery} from '../../api/queries/TrainingIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useTrainingDetails(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [training, setTraining] = useState<TrainingResponse | null>(null);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [isParticipantOfTraining, setIsParticipantOfTraining] = useState<boolean>(false);

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const trainingProvider = new TrainingProvider();
    const userProvider = new UserProvider();

    const fetchTrainingData = async () => {
        if (!link || !access.currentUser) return;

        setDataLoading(true);
        setDataError(null);

        try {
            const filterDto = new TrainingFilterQuery();
            filterDto.link = link;
            const indexDto = new TrainingIndexQuery();
            indexDto.filter = filterDto;

            const trainings = await trainingProvider.index(indexDto);

            if (trainings.length === 0) {
                setDataError('noTrainings');
                return;
            }

            const targetTraining = await trainingProvider.details(trainings[0].id, [
                'trainingDisciplines',
                'trainingDisciplineDistances',
                'trainingDisciplineSubDistances',
                'trainingParticipants'
            ]);

            setTraining(targetTraining);

            const participantCheck = targetTraining.participants?.some(p => p.userId === access.currentUser!.id) ?? false;
            setIsParticipantOfTraining(participantCheck);

            const userIdsToFetch = Array.from(new Set(targetTraining.participants.map(p => p.userId)));
            if (userIdsToFetch.length > 0) {
                const uFilter = new UserFilterQuery();
                uFilter.userIds = userIdsToFetch;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                uIndexDto.limit = userIdsToFetch.length;
                const usersData = await userProvider.index(uIndexDto);
                const usersMap = usersData.reduce((acc, curr) => {
                    acc[curr.id] = curr;
                    return acc;
                }, {} as Record<string, UserResponse>);
                setRelatedUsers(usersMap);
            }

        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchTrainingData();
        }
    }, [link, access.authLoading, access.authError]);

    const refreshTraining = () => {
        fetchTrainingData();
    };

    return {
        ...access,
        ownerUser: access.targetUser,
        training,
        relatedUsers,
        isParticipantOfTraining,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshTraining
    };
}