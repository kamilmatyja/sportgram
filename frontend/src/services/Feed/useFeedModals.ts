import { useState } from 'react';

import { FeedBody } from '../../api/body/FeedBody';
import { StatusBody } from '../../api/body/StatusBody';
import { FeedProvider } from '../../api/providers/FeedProvider';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useCrudModals } from '../../utils/hooks/useCrudModals';

const emptyFeedBody = () => new FeedBody('', '');

export function useFeedModals(onSuccess: () => void) {
    const { addModal, manageModal, loading, globalError, fieldErrors, wrap, resetErrors, submitAdd, submitManage } =
        useCrudModals<FeedResponse>(onSuccess);

    const [formData, setFormData] = useState(emptyFeedBody);
    const feedProvider = new FeedProvider();

    const openAddModal = () => {
        setFormData(emptyFeedBody());
        resetErrors();
        addModal.open();
    };

    const handleAddSubmit = createSubmitHandler(() => submitAdd(() => feedProvider.create(formData)));

    const openManageModal = async (feed: FeedResponse) => {
        resetErrors();
        setFormData(new FeedBody(feed.text, ''));
        manageModal.open(feed);

        await wrap(async () => {
            const currentFeedObj = await feedProvider.details(feed.id, []);
            manageModal.setData(currentFeedObj);
            setFormData(new FeedBody(currentFeedObj.text, ''));
        }).catch(() => manageModal.close());
    };

    const handleEditSubmit = createSubmitHandler(() =>
        submitManage((feed) => feedProvider.update(feed.id, { ...formData, photo: formData.photo || feed.photo })),
    );

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((feed) => feedProvider.updateStatus(feed.id, new StatusBody(newStatus)));

    const handleDelete = () => submitManage((feed) => feedProvider.delete(feed.id));

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
