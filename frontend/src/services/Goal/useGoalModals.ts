import React, { useState } from 'react';

import { GoalBody } from '../../api/body/GoalBody';
import { StatusBody } from '../../api/body/StatusBody';
import { GoalProvider } from '../../api/providers/GoalProvider';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { getErrorMessage } from '../../utils/api';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useAvailableFriends } from '../../utils/hooks/useAvailableFriends';
import { useCrudModals } from '../../utils/hooks/useCrudModals';

const emptyGoalBody = () => new GoalBody(null, null, '', '', 0, 0, null, []);

export function useGoalModals(onSuccess: () => void, currentUser: UserResponse | null) {
    const {
        addModal,
        manageModal,
        loading,
        globalError,
        fieldErrors,
        wrap,
        resetErrors,
        setGlobalError,
        submitAdd,
        submitManage,
    } = useCrudModals<GoalResponse>(onSuccess);
    const { availableUsers, loadAvailableFriends } = useAvailableFriends();

    const [formData, setFormData] = useState(emptyGoalBody);
    const goalProvider = new GoalProvider();

    const openAddModal = async () => {
        setFormData(emptyGoalBody());
        resetErrors();
        await wrap(() => loadAvailableFriends(currentUser)).catch((err) => setGlobalError(getErrorMessage(err)));
        addModal.open();
    };

    const handleAddSubmit = createSubmitHandler(() => submitAdd(() => goalProvider.create(formData)));

    const openManageModal = async (goal: GoalResponse) => {
        resetErrors();
        manageModal.open(goal);

        await wrap(async () => {
            const fullGoal = await goalProvider.details(goal.id, ['goalParticipants']);
            const participantIds = fullGoal.participants?.map((p) => p.userId) || [];
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
                    participantIds,
                ),
            );

            await loadAvailableFriends(currentUser, participantIds);
        }).catch(() => manageModal.close());
    };

    const handleEditSubmit = createSubmitHandler(() => submitManage((goal) => goalProvider.update(goal.id, formData)));

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((goal) => goalProvider.updateStatus(goal.id, new StatusBody(newStatus)));

    const handleDelete = () => submitManage((goal) => goalProvider.delete(goal.id));

    const handleChange = createFormHandler(setFormData);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userIds = Array.from(e.target.selectedOptions).map((o) => o.value);
        setFormData((prev) => ({ ...prev, userIds }));
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
