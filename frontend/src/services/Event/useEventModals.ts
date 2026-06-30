import React, { useState } from 'react';

import { EventBody } from '../../api/body/EventBody';
import { EventDiscipline } from '../../api/body/EventDiscipline';
import { EventDistance } from '../../api/body/EventDistance';
import { EventSubDistance } from '../../api/body/EventSubDistance';
import { StatusBody } from '../../api/body/StatusBody';
import { EventProvider } from '../../api/providers/EventProvider';
import { PageProvider } from '../../api/providers/PageProvider';
import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { PageIndexQuery } from '../../api/queries/PageIndexQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { createFormHandler } from '../../utils/formHandler';
import { useFormState } from '../../utils/hooks/useFormState';
import { useModal } from '../../utils/hooks/useModal';

export function useEventModals(onSuccess: () => void, currentUser: UserResponse | null) {
    const addModal = useModal();
    const manageModal = useModal<EventResponse>();
    const { loading, globalError, fieldErrors, wrap, resetErrors } = useFormState();

    const [myPages, setMyPages] = useState<PageResponse[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');
    const [formData, setFormData] = useState<EventBody>(new EventBody('', '', '', '', '', '', '', '', []));

    const eventProvider = new EventProvider();
    const pageProvider = new PageProvider();

    const fetchMyPages = async () => {
        if (!currentUser) return;
        try {
            const filter = new PageFilterQuery();
            filter.userId = currentUser.id;
            const indexDto = new PageIndexQuery();
            indexDto.filter = filter;
            indexDto.limit = 100;
            const pages = await pageProvider.index(indexDto);
            setMyPages(pages);
        } catch (e) {
            console.error(e);
        }
    };

    const openAddModal = async () => {
        setFormData(new EventBody('', '', '', '', '', '', '', '', []));
        setSelectedPageId('');
        resetErrors();
        await fetchMyPages();
        addModal.open();
    };

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedPageId) {
            return;
        }
        wrap(async () => {
            await eventProvider.create(selectedPageId, formData);
            addModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const openManageModal = async (ev: EventResponse) => {
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

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!manageModal.data) return;
        wrap(async () => {
            formData.photo = formData.photo ? formData.photo : manageModal.data!.photo;
            await eventProvider.update(manageModal.data!.id, formData);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            await eventProvider.updateStatus(manageModal.data!.id, new StatusBody(newStatus));
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await eventProvider.delete(manageModal.data!.id);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const addDiscipline = () => {
        const newDisc = new EventDiscipline();
        newDisc.discipline = 1;
        newDisc.distances = [];
        setFormData((prev) => ({ ...prev, disciplines: [...(prev.disciplines || []), newDisc] }));
    };

    const updateDisciplineType = (index: number, type: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[index].discipline = type;
        setFormData((prev) => ({ ...prev, disciplines: discs }));
    };

    const removeDiscipline = (index: number) => {
        const discs = [...(formData.disciplines || [])];
        discs.splice(index, 1);
        setFormData((prev) => ({ ...prev, disciplines: discs }));
    };

    const addDistance = (discIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        const newDist = new EventDistance();
        newDist.distance = 0;
        newDist.subDistances = [];
        discs[discIndex].distances = [...(discs[discIndex].distances || []), newDist];
        setFormData((prev) => ({ ...prev, disciplines: discs }));
    };

    const updateDistanceValue = (discIndex: number, distIndex: number, val: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].distance = val;
        setFormData((prev) => ({ ...prev, disciplines: discs }));
    };

    const removeDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances!.splice(distIndex, 1);
        setFormData((prev) => ({ ...prev, disciplines: discs }));
    };

    const addSubDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        const newSub = new EventSubDistance();
        newSub.subDistance = 0;
        discs[discIndex].distances![distIndex].subDistances = [
            ...(discs[discIndex].distances![distIndex].subDistances || []),
            newSub,
        ];
        setFormData((prev) => ({ ...prev, disciplines: discs }));
    };

    const updateSubDistanceValue = (discIndex: number, distIndex: number, subIndex: number, val: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].subDistances![subIndex].subDistance = val;
        setFormData((prev) => ({ ...prev, disciplines: discs }));
    };

    const removeSubDistance = (discIndex: number, distIndex: number, subIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].subDistances!.splice(subIndex, 1);
        setFormData((prev) => ({ ...prev, disciplines: discs }));
    };

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
        addDiscipline,
        updateDisciplineType,
        removeDiscipline,
        addDistance,
        updateDistanceValue,
        removeDistance,
        addSubDistance,
        updateSubDistanceValue,
        removeSubDistance,
    };
}
