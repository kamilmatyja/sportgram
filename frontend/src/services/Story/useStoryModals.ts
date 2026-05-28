import React, {useState} from 'react';
import {StoryProvider} from '../../api/providers/StoryProvider';
import {StoryBody} from '../../api/body/StoryBody';
import {StatusBody} from '../../api/body/StatusBody';
import {StoryResponse} from '../../api/responses/StoryResponse';
import {createFormHandler} from '../../utils/formHandler';
import {useModal} from '../../utils/hooks/useModal';
import {useFormState} from '../../utils/hooks/useFormState';

export function useStoryModals(onSuccess: () => void) {
    const addModal = useModal();
    const manageModal = useModal<StoryResponse>();
    const { loading, globalError, fieldErrors, wrap, resetErrors } = useFormState();

    const [formData, setFormData] = useState(new StoryBody('', ''));

    const storyProvider = new StoryProvider();

    const openAddModal = () => {
        setFormData(new StoryBody('', ''));
        resetErrors();
        addModal.open();
    };

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        wrap(async () => {
            await storyProvider.create(formData);
            addModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const openManageModal = (story: StoryResponse) => {
        resetErrors();
        manageModal.open(story);
        setFormData(new StoryBody(story.text, ''));
    };

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!manageModal.data) return;
        wrap(async () => {
            formData.photo = formData.photo ? formData.photo : manageModal.data!.photo;
            await storyProvider.update(manageModal.data!.id, formData);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            await storyProvider.updateStatus(manageModal.data!.id, new StatusBody(newStatus));
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await storyProvider.delete(manageModal.data!.id);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleChange = createFormHandler(setFormData);

    return {
        showAdd: addModal.isOpen, openAddModal, closeAddModal: addModal.close, handleAddSubmit,
        showManage: manageModal.isOpen, openManageModal, closeManageModal: manageModal.close,
        currentStory: manageModal.data, handleEditSubmit, handleStatusSubmit, handleDelete,
        formData, handleChange, loading, globalError, fieldErrors
    };
}