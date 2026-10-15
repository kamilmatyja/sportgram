import { useState } from 'react';

import { EventBody } from '../../api/body/EventBody';
import { EventDiscipline } from '../../api/body/EventDiscipline';
import { EventDistance } from '../../api/body/EventDistance';
import { EventSubDistance } from '../../api/body/EventSubDistance';
import { StatusBody } from '../../api/body/StatusBody';
import { EventProvider } from '../../api/providers/EventProvider';
import { EventResponse } from '../../api/responses/EventResponse';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { getErrorMessage } from '../../utils/api';
import { createDisciplinesEditor } from '../../utils/disciplinesEditor';
import { fetchUserPages } from '../../utils/fetchUserPages';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useCrudModals } from '../../utils/hooks/useCrudModals';

const emptyEventBody = () => new EventBody('', '', '', '', '', '', '', '', []);

export function useEventModals(onSuccess: () => void, currentUser: UserResponse | null) {
    const {
        addModal,
        manageModal,
        loading,
        globalError,
        fieldErrors,
        resetErrors,
        setGlobalError,
        submitAdd,
        submitManage,
    } = useCrudModals<EventResponse>(onSuccess);

    const [myPages, setMyPages] = useState<PageResponse[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');
    const [formData, setFormData] = useState<EventBody>(emptyEventBody);

    const eventProvider = new EventProvider();

    const disciplinesEditor = createDisciplinesEditor<EventBody, EventDistance, EventSubDistance>(
        setFormData,
        () => ({ distance: 0, subDistances: [] }),
        () => ({ subDistance: 0 }),
    );

    const openAddModal = async () => {
        setFormData(emptyEventBody());
        setSelectedPageId('');
        resetErrors();
        if (currentUser) {
            try {
                setMyPages(await fetchUserPages(currentUser.id));
            } catch (err) {
                setMyPages([]);
                setGlobalError(getErrorMessage(err));
            }
        }
        addModal.open();
    };

    const handleAddSubmit = createSubmitHandler(() => {
        if (!selectedPageId) return;
        return submitAdd(() => eventProvider.create(selectedPageId, formData));
    });

    const openManageModal = (ev: EventResponse) => {
        manageModal.open(ev);
        const disciplinesMapped: EventDiscipline[] = ev.disciplines.map((d) => ({
            discipline: d.discipline,
            distances: d.distances.map((dist) => ({
                distance: dist.distance,
                subDistances: dist.subDistances.map((sub) => ({
                    subDistance: sub.subDistance,
                })),
            })),
        }));

        setFormData(
            new EventBody(
                ev.startedAt.substring(0, 16),
                ev.endedAt.substring(0, 16),
                ev.title,
                ev.description,
                ev.link,
                ev.rules,
                '',
                ev.location,
                disciplinesMapped,
            ),
        );
        resetErrors();
    };

    const handleEditSubmit = createSubmitHandler(() =>
        submitManage((ev) => eventProvider.update(ev.id, { ...formData, photo: formData.photo || ev.photo })),
    );

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((ev) => eventProvider.updateStatus(ev.id, new StatusBody(newStatus)));

    const handleDelete = () => submitManage((ev) => eventProvider.delete(ev.id));

    const handleChange = createFormHandler(setFormData);

    return {
        showAdd: addModal.isOpen,
        openAddModal,
        closeAddModal: addModal.close,
        handleAddSubmit,
        myPages,
        selectedPageId,
        setSelectedPageId,
        showManage: manageModal.isOpen,
        openManageModal,
        closeManageModal: manageModal.close,
        handleEditSubmit,
        handleStatusSubmit,
        handleDelete,
        currentEvent: manageModal.data,
        formData,
        handleChange,
        loading,
        globalError,
        fieldErrors,
        addDiscipline: disciplinesEditor.addDiscipline,
        updateDisciplineType: disciplinesEditor.updateDisciplineType,
        removeDiscipline: disciplinesEditor.removeDiscipline,
        addDistance: disciplinesEditor.addDistance,
        updateDistanceValue: (discIndex: number, distIndex: number, distance: number) =>
            disciplinesEditor.updateDistance(discIndex, distIndex, { distance }),
        removeDistance: disciplinesEditor.removeDistance,
        addSubDistance: disciplinesEditor.addSubDistance,
        updateSubDistanceValue: (discIndex: number, distIndex: number, subIndex: number, subDistance: number) =>
            disciplinesEditor.updateSubDistance(discIndex, distIndex, subIndex, { subDistance }),
        removeSubDistance: disciplinesEditor.removeSubDistance,
    };
}
