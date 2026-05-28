import {useEffect, useState} from 'react';
import {GoalProvider} from '../../api/providers/GoalProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {GoalFilterQuery} from '../../api/queries/GoalFilterQuery';
import {GoalIndexQuery} from '../../api/queries/GoalIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useGoalDetails(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [goal, setGoal] = useState<GoalResponse | null>(null);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [isParticipantOfGoal, setIsParticipantOfGoal] = useState<boolean>(false);

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const goalProvider = new GoalProvider();
    const userProvider = new UserProvider();

    const fetchGoalData = async () => {
        if (!link || !access.currentUser || !access.targetUser) return;

        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new GoalFilterQuery();
            filterDto.link = link;
            const indexDto = new GoalIndexQuery();
            indexDto.filter = filterDto;

            const goals = await goalProvider.index(indexDto);

            if (goals.length === 0) {
                setDataError('noGoals');
                return;
            }

            const targetGoal = await goalProvider.details(goals[0].id, [
                'goalParticipants',
                'goalParticipantResults'
            ]);

            setGoal(targetGoal);

            const participantCheck = targetGoal.participants?.some(p => p.userId === access.currentUser!.id) ?? false;
            setIsParticipantOfGoal(participantCheck);

            const userIdsToFetch = Array.from(new Set(targetGoal.participants.map(p => p.userId)));
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
            fetchGoalData();
        }
    }, [link, access.authLoading, access.authError]);

    const refreshGoal = () => {
        fetchGoalData();
    };

    return {
        ...access,
        ownerUser: access.targetUser,
        goal,
        relatedUsers,
        isParticipantOfGoal,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshGoal
    };
}