import {useEffect, useState} from 'react';
import {GoalProvider} from '../../api/providers/GoalProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {GoalFilterQuery} from '../../api/queries/GoalFilterQuery';
import {GoalIndexQuery} from '../../api/queries/GoalIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useDataFetch} from '../../utils/hooks/useDataFetch';

export function useGoalDetails(link?: string) {
    const access = useAppAccess();

    const { data: goal, loading, error, executeFetch } = useDataFetch<GoalResponse>();
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [isParticipantOfGoal, setIsParticipantOfGoal] = useState<boolean>(false);
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

    const goalProvider = new GoalProvider();
    const userProvider = new UserProvider();

    const fetchGoalData = () => {
        if (!link || !access.currentUser) return;

        executeFetch(async () => {
            const filterDto = new GoalFilterQuery();
            filterDto.link = link;
            const indexDto = new GoalIndexQuery();
            indexDto.filter = filterDto;
            indexDto.include = [
                'goalParticipants',
                'goalParticipantResults'
            ];

            const goals = await goalProvider.index(indexDto);
            if (goals.length === 0) {
                throw { error: 'noRecords' };
            }

            const targetGoal = goals[0];

            const owner = await userProvider.details(targetGoal.userId);
            setOwnerUser(owner);
            setIsMyProfile(access.currentUser!.id === owner.id);

            const participantCheck = targetGoal.participants?.some(p => p.userId === access.currentUser!.id) ?? false;
            setIsParticipantOfGoal(participantCheck);

            const userIds = targetGoal.participants.map(p => p.userId);
            const updatedUsers = await fetchRelatedUsers(userIds, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

            return targetGoal;
        }, null as unknown as GoalResponse);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchGoalData();
        }
    }, [link, access.authLoading, access.authError]);

    const refreshGoal = () => fetchGoalData();

    return {
        ...access,
        ownerUser,
        goal,
        relatedUsers,
        isParticipantOfGoal,
        isMyProfile,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshGoal
    };
}