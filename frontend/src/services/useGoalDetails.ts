import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {GoalProvider} from '../api/providers/GoalProvider';
import {UserProvider} from '../api/providers/UserProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {GoalBody} from '../api/body/GoalBody';
import {StatusBody} from '../api/body/StatusBody';
import {GoalResponse} from '../api/responses/GoalResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {createFormHandler} from '../utils/formHandler';
import {useCheckPermission} from '../utils/checkPermission';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {FriendFilterQuery} from '../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {GoalFilterQuery} from '../api/queries/GoalFilterQuery';
import {GoalIndexQuery} from '../api/queries/GoalIndexQuery';
import {RoleEnum} from '../enums/RoleEnum';

export function useGoalDetails(link?: string) {
    const navigate = useNavigate();
    const {getCurrentUser} = useCheckPermission();

    const [goal, setGoal] = useState<GoalResponse | null>(null);
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [successMsg, setSuccessMsg] = useState<string>('');

    const [formData, setFormData] = useState(new GoalBody(null, null, '', '', 0, 0, null, []));

    const goalProvider = new GoalProvider();
    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const loadAvailableFriends = async (currentUsr: UserResponse) => {
        const fFilter = new FriendFilterQuery();
        fFilter.userIds = [currentUsr.id];
        fFilter.status = FriendStatusEnum.ACCEPTED;
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilter;

        const myFriends = await friendProvider.index(fIndexDto);

        const acceptedFriendIds = new Set<string>();
        myFriends.forEach(f => {
            if (f.senderUserId !== currentUsr.id) acceptedFriendIds.add(f.senderUserId);
            if (f.receiverUserId !== currentUsr.id) acceptedFriendIds.add(f.receiverUserId);
        });

        if (acceptedFriendIds.size > 0) {
            const uFilter = new UserFilterQuery();
            uFilter.userIds = Array.from(acceptedFriendIds);
            const uIndexDto = new UserIndexQuery();
            uIndexDto.filter = uFilter;
            const acceptedFriendsUsers = await userProvider.index(uIndexDto);
            setAvailableUsers(acceptedFriendsUsers);
        } else {
            setAvailableUsers([]);
        }
    };

    const fetchGoalData = async () => {
        setLoading(true);
        setError(null);
        try {
            const currentUsr = await getCurrentUser();
            setCurrentUser(currentUsr);

            if (!currentUsr || !link) {
                setError('unauthorizedEdit');
                return;
            }

            const adminCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
            setIsAdmin(adminCheck);

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

            setGoal(targetGoal);

            const owner = await userProvider.details(targetGoal.userId);
            setOwnerUser(owner);

            const isOwner = currentUsr.id === owner.id;
            setIsMyProfile(isOwner);

            setFormData(new GoalBody(
                targetGoal.startedAt ? targetGoal.startedAt.substring(0, 16) : null,
                targetGoal.endedAt ? targetGoal.endedAt.substring(0, 16) : null,
                targetGoal.text,
                targetGoal.link,
                targetGoal.discipline,
                targetGoal.distance,
                targetGoal.time,
                targetGoal.participants.map(p => p.userId)
            ));

            if (isOwner || adminCheck) {
                await loadAvailableFriends(owner);
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

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!goal) return;
        setSubmitLoading(true);
        setGlobalError('');
        setFieldErrors({});
        setSuccessMsg('');
        try {
            await goalProvider.update(goal.id, formData);
            setSuccessMsg('settingsUpdated');
            await fetchGoalData();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!goal) return;
        setSubmitLoading(true);
        setGlobalError('');
        setSuccessMsg('');
        try {
            await goalProvider.updateStatus(goal.id, new StatusBody(newStatus));
            await fetchGoalData();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleParticipantStatusSubmit = async (participantId: string, newStatus: number) => {
        setSubmitLoading(true);
        setGlobalError('');
        setSuccessMsg('');
        try {
            await goalProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            await fetchGoalData();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleParticipantResultStatusSubmit = async (resultId: string, newStatus: number) => {
        setSubmitLoading(true);
        setGlobalError('');
        setSuccessMsg('');
        try {
            await goalProvider.updateParticipantResultStatus(resultId, new StatusBody(newStatus));
            await fetchGoalData();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!goal || !ownerUser) return;
        setSubmitLoading(true);
        setGlobalError('');
        try {
            await goalProvider.delete(goal.id);
            navigate(`/users/${ownerUser.link}/goals`);
        } catch (err: any) {
            setGlobalError(err.error);
            setSubmitLoading(false);
        }
    };

    const handleChange = createFormHandler(setFormData);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData(prev => ({...prev, participants: selected}));
    };

    return {
        goal,
        ownerUser,
        currentUser,
        availableUsers,
        isMyProfile,
        isAdmin,
        loading,
        submitLoading,
        error,
        globalError,
        fieldErrors,
        successMsg,
        formData,
        handleChange,
        handleParticipantsChange,
        handleEditSubmit,
        handleStatusSubmit,
        handleParticipantStatusSubmit,
        handleParticipantResultStatusSubmit,
        handleDelete
    };
}