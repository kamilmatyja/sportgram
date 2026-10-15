import React, { useState } from 'react';

import { PageBody } from '../../api/body/PageBody';
import { StatusBody } from '../../api/body/StatusBody';
import { PageProvider } from '../../api/providers/PageProvider';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { getErrorMessage } from '../../utils/api';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useAvailableFriends } from '../../utils/hooks/useAvailableFriends';
import { useCrudModals } from '../../utils/hooks/useCrudModals';

const emptyPageBody = () => new PageBody('', '', '', '', '', 0, []);

export function usePageModals(onSuccess: () => void, currentUser: UserResponse | null) {
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
    } = useCrudModals<PageResponse>(onSuccess);
    const { availableUsers, loadAvailableFriends } = useAvailableFriends();

    const [formData, setFormData] = useState(emptyPageBody);
    const pageProvider = new PageProvider();

    const openAddModal = async () => {
        setFormData(emptyPageBody());
        resetErrors();
        await wrap(() => loadAvailableFriends(currentUser)).catch((err) => setGlobalError(getErrorMessage(err)));
        addModal.open();
    };

    const handleAddSubmit = createSubmitHandler(() => submitAdd(() => pageProvider.create(formData)));

    const openManageModal = async (page: PageResponse) => {
        const participantIds = page.participants.map((p) => p.userId);
        manageModal.open(page);
        setFormData(new PageBody(page.title, page.description, page.link, '', '', page.color, participantIds));
        resetErrors();
        await wrap(() => loadAvailableFriends(currentUser, participantIds)).catch((err) =>
            setGlobalError(getErrorMessage(err)),
        );
    };

    const handleEditSubmit = createSubmitHandler(() =>
        submitManage((page) =>
            pageProvider.update(page.id, {
                ...formData,
                profilePhoto: formData.profilePhoto || page.profilePhoto,
                backgroundPhoto: formData.backgroundPhoto || page.backgroundPhoto,
            }),
        ),
    );

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((page) => pageProvider.updateStatus(page.id, new StatusBody(newStatus)));

    const handleDelete = () => submitManage((page) => pageProvider.delete(page.id));

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
        currentPageObj: manageModal.data,
        formData,
        handleChange,
        handleParticipantsChange,
        loading,
        globalError,
        fieldErrors,
    };
}
