import React, { useState } from 'react';

import { GoalBody } from '../../api/body/GoalBody';
import { StatusBody } from '../../api/body/StatusBody';
import { FriendProvider } from '../../api/providers/FriendProvider';
import { GoalProvider } from '../../api/providers/GoalProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../../api/queries/FriendIndexQuery';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { fetchRelatedUsers } from '../../utils/fetchRelatedUsers';
import { createFormHandler } from '../../utils/formHandler';
import { useAppAccess } from '../../utils/hooks/useAppAccess';
import { useFormState } from '../../utils/hooks/useFormState';
import { useModal } from '../../utils/hooks/useModal';

export function useGoalModals(onSuccess: () => void) {
    const { currentUser } = useAppAccess();
    const addModal = useModal();
    const manageModal = useModal<GoalResponse>();
    const { loading, globalError, fieldErrors, wrap, resetErrors } = useFormState();

    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
    const [formData, setFormData] = useState(new GoalBody(null, null, '', '', 0, 0, null, []));

    const goalProvider = new GoalProvider();
    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const loadAvailableFriends = async (currentUsr: UserResponse, goalObj?: GoalResponse | null) => {
        const fFilter = new FriendFilterQuery();
        fFilter.userIds = [currentUsr.id];
        fFilter.status = FriendStatusEnum.ACCEPTED;
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilter;

        const myFriends = await friendProvider.index(fIndexDto);

        const userIdsToFetch = new Set<string>();
        myFriends.forEach((f) => {
            if (f.senderUserId !== currentUsr.id) userIdsToFetch.add(f.senderUserId);
            if (f.receiverUserId !== currentUsr.id) userIdsToFetch.add(f.receiverUserId);
        });

        if (goalObj && goalObj.participants) {
            goalObj.participants.forEach((p) => userIdsToFetch.add(p.userId));
        }

        const idsArray = Array.from(userIdsToFetch);
        if (idsArray.length > 0) {
            const usersMap = await fetchRelatedUsers(idsArray, {}, userProvider);
            setAvailableUsers(Object.values(usersMap));
        } else {
            setAvailableUsers([]);
        }
    };

    const openAddModal = async () => {
        setFormData(new GoalBody(null, null, '', '', 0, 0, null, []));
        resetErrors();
        await wrap(async () => {
            if (currentUser) {
                await loadAvailableFriends(currentUser);
            }
        }).catch(() => {});
        addModal.open();
    };

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        wrap(async () => {
            await goalProvider.create(formData);
            addModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const openManageModal = async (goal: GoalResponse) => {
        resetErrors();
        manageModal.open(goal);

        await wrap(async () => {
            const fullGoal = await goalProvider.details(goal.id, ['goalParticipants']);
            manageModal.setData(fullGoal);

            setFormData(
                new GoalBody(
                    fullGoal.startedAt ? fullGoal.startedAt.substring(0, 16) : null,
                    fullGoal.endedAt ? fullGoal.endedAt.substring(0, 16) : null,
                    fullGoal.text,
                    fullGoal.link,
                    fullGoal.discipline,
                    fullGoal.distance,
                    fullGoal.time,
                    fullGoal.participants ? fullGoal.participants.map((p) => p.userId) : [],
                ),
            );

            if (currentUser) {
                await loadAvailableFriends(currentUser, fullGoal);
            }
        }).catch(() => {
            manageModal.close();
        });
    };

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!manageModal.data) return;
        wrap(async () => {
            await goalProvider.update(manageModal.data!.id, formData);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            await goalProvider.updateStatus(manageModal.data!.id, new StatusBody(newStatus));
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await goalProvider.delete(manageModal.data!.id);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleChange = createFormHandler(setFormData);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
        setFormData((prev) => ({ ...prev, participants: selected }));
    };

    return {
        showAdd: addModal.isOpen,
        openAddModal,
        closeAddModal: addModal.close,
        handleAddSubmit,
        availableUsers,
        showManage: manageModal.isOpen,
        openManageModal,
        closeManageModal: manageModal.close,
        handleEditSubmit,
        handleStatusSubmit,
        handleDelete,
        currentGoal: manageModal.data,
        formData,
        handleChange,
        handleParticipantsChange,
        loading,
        globalError,
        fieldErrors,
    };
}
