import {useEffect, useState} from 'react';
import {TrainingProvider} from '../../api/providers/TrainingProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {TrainingFilterQuery} from '../../api/queries/TrainingFilterQuery';
import {TrainingIndexQuery} from '../../api/queries/TrainingIndexQuery';
import {profileAccess} from '../../utils/profileAccess';

export function useTrainingDetails(link?: string) {
    const {checkAccess} = profileAccess();

    const [training, setTraining] = useState<TrainingResponse | null>(null);
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isParticipantOfTraining, setIsParticipantOfTraining] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const trainingProvider = new TrainingProvider();
    const userProvider = new UserProvider();

    const fetchTrainingData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!link) {
                setError('unauthorizedEdit');
                return;
            }

            const filterDto = new TrainingFilterQuery();
            filterDto.link = link;
            const indexDto = new TrainingIndexQuery();
            indexDto.filter = filterDto;

            const trainings = await trainingProvider.index(indexDto);

            if (trainings.length === 0) {
                setError('noTrainings');
                return;
            }

            const targetTraining = await trainingProvider.details(trainings[0].id, [
                'trainingDisciplines',
                'trainingDisciplineDistances',
                'trainingDisciplineSubDistances',
                'trainingParticipants'
            ]);

            const access = await checkAccess({ id: targetTraining.userId }, { requireFriendship: true });

            setTraining(targetTraining);
            setCurrentUser(access.currentUser);
            setOwnerUser(access.targetUser);
            setIsAdmin(access.isAdmin);
            setIsMyProfile(access.isMyProfile);

            const participantCheck = targetTraining.participants?.some(p => p.userId === access.currentUser.id) ?? false;
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
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainingData();
    }, [link]);

    const refreshTraining = () => {
        fetchTrainingData();
    };

    return {
        training, ownerUser, currentUser, relatedUsers, isMyProfile, isAdmin, isParticipantOfTraining,
        loading, error, refreshTraining
    };
}