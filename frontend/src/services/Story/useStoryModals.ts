import React, {useState} from 'react';
import {StoryProvider} from '../../api/providers/StoryProvider';
import {StoryBody} from '../../api/body/StoryBody';
import {StatusBody} from '../../api/body/StatusBody';
import {StoryResponse} from '../../api/responses/StoryResponse';
import {createFormHandler} from '../../utils/formHandler';

export function useStoryModals(onSuccess: () => void) {
    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);
    const [currentStory, setCurrentStory] = useState<StoryResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [formData, setFormData] = useState(new StoryBody('', ''));

    const storyProvider = new StoryProvider();

    const openAddModal = () => {
        setFormData(new StoryBody('', ''));
        setGlobalError('');
        setFieldErrors({});
        setShowAdd(true);
    };

    const closeAddModal = () => setShowAdd(false);

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            await storyProvider.create(formData);
            closeAddModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const openManageModal = (story: StoryResponse) => {
        setCurrentStory(story);
        setFormData(new StoryBody(story.text, ''));
        setGlobalError('');
        setFieldErrors({});
        setShowManage(true);
    };

    const closeManageModal = () => setShowManage(false);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentStory) return;
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            formData.photo = formData.photo ? formData.photo : currentStory.photo;
            await storyProvider.update(currentStory.id, formData);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!currentStory) return;
        setLoading(true);
        setGlobalError('');
        try {
            await storyProvider.updateStatus(currentStory.id, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentStory) return;
        setLoading(true);
        setGlobalError('');
        try {
            await storyProvider.delete(currentStory.id);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = createFormHandler(setFormData);

    return {
        showAdd, openAddModal, closeAddModal, handleAddSubmit,
        showManage, openManageModal, closeManageModal, currentStory, handleEditSubmit, handleStatusSubmit, handleDelete,
        formData, handleChange, loading, globalError, fieldErrors
    };
}