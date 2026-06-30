import React, { useState } from 'react';

import { FeedBody } from '../../api/body/FeedBody';
import { StatusBody } from '../../api/body/StatusBody';
import { FeedProvider } from '../../api/providers/FeedProvider';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { createFormHandler } from '../../utils/formHandler';
import { useFormState } from '../../utils/hooks/useFormState';
import { useModal } from '../../utils/hooks/useModal';

export function useFeedModals(onSuccess: () => void) {
    const addModal = useModal();
    const manageModal = useModal<FeedResponse>();
    const { loading, globalError, fieldErrors, wrap, resetErrors } = useFormState();

    const [formData, setFormData] = useState(new FeedBody('', ''));
    const feedProvider = new FeedProvider();

    const openAddModal = () => {
        setFormData(new FeedBody('', ''));
        resetErrors();
        addModal.open();
    };

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        wrap(async () => {
            await feedProvider.create(formData);
            addModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const openManageModal = async (feed: FeedResponse) => {
        resetErrors();
        manageModal.open(feed);
        const currentFeedObj = await feedProvider.details(feed.id, []);
        manageModal.setData(currentFeedObj);
        setFormData(new FeedBody(currentFeedObj.text, ''));
    };

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!manageModal.data) return;
        wrap(async () => {
            formData.photo = formData.photo ? formData.photo : manageModal.data!.photo;
            await feedProvider.update(manageModal.data!.id, formData);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            await feedProvider.updateStatus(manageModal.data!.id, new StatusBody(newStatus));
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await feedProvider.delete(manageModal.data!.id);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleChange = createFormHandler(setFormData);

    return {
        showAdd: addModal.isOpen,
        openAddModal,
        closeAddModal: addModal.close,
        handleAddSubmit,
        showManage: manageModal.isOpen,
        openManageModal,
        closeManageModal: manageModal.close,
        currentFeed: manageModal.data,
        handleEditSubmit,
        handleStatusSubmit,
        handleDelete,
        formData,
        handleChange,
        loading,
        globalError,
        fieldErrors,
    };
}
