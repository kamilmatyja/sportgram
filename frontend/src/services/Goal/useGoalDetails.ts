import {useEffect, useState} from 'react';
import {GoalProvider} from '../../api/providers/GoalProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {GoalFilterQuery} from '../../api/queries/GoalFilterQuery';
import {GoalIndexQuery} from '../../api/queries/GoalIndexQuery';
import {profileAccess} from '../../utils/profileAccess';

export function useGoalDetails(link?: string) {
    const {checkAccess} = profileAccess();

    const [goal, setGoal] = useState<GoalResponse | null>(null);
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isParticipantOfGoal, setIsParticipantOfGoal] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const goalProvider = new GoalProvider();
    const userProvider = new UserProvider();

    const fetchGoalData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!link) {
                setError('unauthorizedEdit');
                return;
            }

            const filterDto = new GoalFilterQuery();
            filterDto.link = link;
            const indexDto = new GoalIndexQuery();
            indexDto.filter = filterDto;

            const goals = await goalProvider.index(indexDto);

            if (goals.length === 0) {
                setError('noGoals');
                return;
            }

            const targetGoal = await goalProvider.details(goals[0].id, [
                'goalParticipants',
                'goalParticipantResults'
            ]);

            const access = await checkAccess({ id: targetGoal.userId }, { requireFriendship: true });

            setGoal(targetGoal);
            setCurrentUser(access.currentUser);
            setOwnerUser(access.targetUser);
            setIsAdmin(access.isAdmin);
            setIsMyProfile(access.isMyProfile);

            const participantCheck = targetGoal.participants?.some(p => p.userId === access.currentUser.id) ?? false;
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
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoalData();
    }, [link]);

    const refreshGoal = () => {
        fetchGoalData();
    };

    return {
        goal, ownerUser, currentUser, relatedUsers, isMyProfile, isAdmin, isParticipantOfGoal,
        loading, error, refreshGoal
    };
}