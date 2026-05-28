import React, {useState} from 'react';
import {GoalProvider} from '../../api/providers/GoalProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {GoalBody} from '../../api/body/GoalBody';
import {StatusBody} from '../../api/body/StatusBody';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {createFormHandler} from '../../utils/formHandler';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {FriendFilterQuery} from '../../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../../api/queries/FriendIndexQuery';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';

export function useGoalModals(onSuccess: () => void) {
    const { currentUser } = useAppAccess();

    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);

    const [currentGoal, setCurrentGoal] = useState<GoalResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

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
            const usersMap = await fetchRelatedUsers(Array.from(acceptedFriendIds), {}, userProvider);
            setAvailableUsers(Object.values(usersMap));
        } else {
            setAvailableUsers([]);
        }
    };

    const openAddModal = async () => {
        setFormData(new GoalBody(null, null, '', '', 0, 0, null, []));
        setGlobalError('');
        setFieldErrors({});
        setLoading(true);

        try {
            if (currentUser) {
                await loadAvailableFriends(currentUser);
            }
        } catch (e: any) {
            setGlobalError(e.error);
        } finally {
            setLoading(false);
            setShowAdd(true);
        }
    };

    const closeAddModal = () => setShowAdd(false);

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            await goalProvider.create(formData);
            closeAddModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const openManageModal = async (goal: GoalResponse) => {
        setCurrentGoal(goal);
        setFormData(new GoalBody(
            goal.startedAt ? goal.startedAt.substring(0, 16) : null,
            goal.endedAt ? goal.endedAt.substring(0, 16) : null,
            goal.text,
            goal.link,
            goal.discipline,
            goal.distance,
            goal.time,
            goal.participants.map(p => p.userId)
        ));
        setGlobalError('');
        setFieldErrors({});
        setLoading(true);

        try {
            if (currentUser) {
                await loadAvailableFriends(currentUser);
            }
        } catch (e: any) {
            setGlobalError(e.error);
        } finally {
            setLoading(false);
            setShowManage(true);
        }
    };

    const closeManageModal = () => setShowManage(false);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentGoal) return;
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            await goalProvider.update(currentGoal.id, formData);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!currentGoal) return;
        setLoading(true);
        setGlobalError('');
        try {
            await goalProvider.updateStatus(currentGoal.id, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentGoal) return;
        setLoading(true);
        setGlobalError('');
        try {
            await goalProvider.delete(currentGoal.id);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = createFormHandler(setFormData);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData(prev => ({...prev, participants: selected}));
    };

    return {
        showAdd, openAddModal, closeAddModal, handleAddSubmit, availableUsers,
        showManage, openManageModal, closeManageModal, handleEditSubmit, handleStatusSubmit, handleDelete,
        currentGoal, formData, handleChange, handleParticipantsChange, loading, globalError, fieldErrors
    };
}