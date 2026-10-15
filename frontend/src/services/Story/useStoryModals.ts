import { useState } from 'react';

import { StatusBody } from '../../api/body/StatusBody';
import { StoryBody } from '../../api/body/StoryBody';
import { StoryProvider } from '../../api/providers/StoryProvider';
import { StoryResponse } from '../../api/responses/StoryResponse';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useCrudModals } from '../../utils/hooks/useCrudModals';

const emptyStoryBody = () => new StoryBody('', '');

export function useStoryModals(onSuccess: () => void) {
    const { addModal, manageModal, loading, globalError, fieldErrors, resetErrors, submitAdd, submitManage } =
        useCrudModals<StoryResponse>(onSuccess);

    const [formData, setFormData] = useState(emptyStoryBody);
    const storyProvider = new StoryProvider();

    const openAddModal = () => {
        setFormData(emptyStoryBody());
        resetErrors();
        addModal.open();
    };

    const handleAddSubmit = createSubmitHandler(() => submitAdd(() => storyProvider.create(formData)));

    const openManageModal = (story: StoryResponse) => {
        resetErrors();
        manageModal.open(story);
        setFormData(new StoryBody(story.text, ''));
    };

    const handleEditSubmit = createSubmitHandler(() =>
        submitManage((story) => storyProvider.update(story.id, { ...formData, photo: formData.photo || story.photo })),
    );

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((story) => storyProvider.updateStatus(story.id, new StatusBody(newStatus)));

    const handleDelete = () => submitManage((story) => storyProvider.delete(story.id));

    const handleChange = createFormHandler(setFormData);

    return {
        showAdd: addModal.isOpen,
        openAddModal,
        closeAddModal: addModal.close,
        handleAddSubmit,
        showManage: manageModal.isOpen,
        openManageModal,
        closeManageModal: manageModal.close,
        currentStory: manageModal.data,
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
