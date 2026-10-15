import React, { useState } from 'react';

import { StatusBody } from '../../api/body/StatusBody';
import { TrainingBody } from '../../api/body/TrainingBody';
import { TrainingDiscipline } from '../../api/body/TrainingDiscipline';
import { TrainingDistance } from '../../api/body/TrainingDistance';
import { TrainingSubDistance } from '../../api/body/TrainingSubDistance';
import { TrainingProvider } from '../../api/providers/TrainingProvider';
import { TRAINING_INCLUDES } from '../../api/queries/includes';
import { TrainingResponse } from '../../api/responses/TrainingResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { createDisciplinesEditor } from '../../utils/disciplinesEditor';
import { getErrorMessage } from '../../utils/api';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useAvailableFriends } from '../../utils/hooks/useAvailableFriends';
import { useCrudModals } from '../../utils/hooks/useCrudModals';

const emptyTrainingBody = () => new TrainingBody('', '', '', '', '', '', [], []);

export function useTrainingModals(onSuccess: () => void, currentUser: UserResponse | null) {
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
    } = useCrudModals<TrainingResponse>(onSuccess);
    const { availableUsers, loadAvailableFriends } = useAvailableFriends();

    const [formData, setFormData] = useState<TrainingBody>(emptyTrainingBody);
    const trainingProvider = new TrainingProvider();

    const disciplinesEditor = createDisciplinesEditor<TrainingBody, TrainingDistance, TrainingSubDistance>(
        setFormData,
        () => ({ distance: 0, time: 0, subDistances: [] }),
        () => ({ subDistance: 0, time: 0 }),
    );

    const openAddModal = async () => {
        setFormData(emptyTrainingBody());
        resetErrors();
        await wrap(() => loadAvailableFriends(currentUser)).catch((err) => setGlobalError(getErrorMessage(err)));
        addModal.open();
    };

    const handleAddSubmit = createSubmitHandler(() => submitAdd(() => trainingProvider.create(formData)));

    const openManageModal = async (tr: TrainingResponse) => {
        resetErrors();
        manageModal.open(tr);

        await wrap(async () => {
            const fullTraining = await trainingProvider.details(tr.id, TRAINING_INCLUDES);
            const participantIds = fullTraining.participants?.map((p) => p.userId) || [];
            manageModal.setData(fullTraining);

            const disciplinesMapped: TrainingDiscipline[] = (fullTraining.disciplines || []).map((d) => ({
                discipline: d.discipline,
                distances: (d.distances || []).map((dist) => ({
                    distance: dist.distance,
                    time: dist.time,
                    subDistances: (dist.subDistances || []).map((sub) => ({
                        subDistance: sub.subDistance,
                        time: sub.time,
                        lat: sub.lat,
                        lng: sub.lng,
                        accuracy: sub.accuracy,
                        speed: sub.speed,
                    })),
                })),
            }));

            setFormData(
                new TrainingBody(
                    fullTraining.startedAt ? fullTraining.startedAt.substring(0, 16) : '',
                    fullTraining.endedAt ? fullTraining.endedAt.substring(0, 16) : '',
                    fullTraining.title,
                    fullTraining.description,
                    fullTraining.link,
                    fullTraining.location,
                    disciplinesMapped,
                    participantIds,
                ),
            );

            await loadAvailableFriends(currentUser, participantIds);
        }).catch(() => manageModal.close());
    };

    const handleEditSubmit = createSubmitHandler(() =>
        submitManage((training) => trainingProvider.update(training.id, formData)),
    );

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((training) => trainingProvider.updateStatus(training.id, new StatusBody(newStatus)));

    const handleDelete = () => submitManage((training) => trainingProvider.delete(training.id));

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
        currentTraining: manageModal.data,
        formData,
        handleChange,
        handleParticipantsChange,
        loading,
        globalError,
        fieldErrors,
        addDiscipline: disciplinesEditor.addDiscipline,
        updateDisciplineType: disciplinesEditor.updateDisciplineType,
        removeDiscipline: disciplinesEditor.removeDiscipline,
        addDistance: disciplinesEditor.addDistance,
        updateDistanceValue: (discIndex: number, distIndex: number, field: 'distance' | 'time', val: number) =>
            disciplinesEditor.updateDistance(discIndex, distIndex, { [field]: val }),
        removeDistance: disciplinesEditor.removeDistance,
        addSubDistance: disciplinesEditor.addSubDistance,
        updateSubDistanceValue: (
            discIndex: number,
            distIndex: number,
            subIndex: number,
            field: 'subDistance' | 'time',
            val: number,
        ) => disciplinesEditor.updateSubDistance(discIndex, distIndex, subIndex, { [field]: val }),
        removeSubDistance: disciplinesEditor.removeSubDistance,
    };
}
