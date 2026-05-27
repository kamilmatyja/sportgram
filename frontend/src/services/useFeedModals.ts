import React, {useState} from 'react';
import {FeedProvider} from '../api/providers/FeedProvider';
import {FeedBody} from '../api/body/FeedBody';
import {StatusBody} from '../api/body/StatusBody';
import {FeedResponse} from '../api/responses/FeedResponse';
import {createFormHandler} from '../utils/formHandler';

export function useFeedModals(onSuccess: () => void) {
    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);
    const [currentFeed, setCurrentFeed] = useState<FeedResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [formData, setFormData] = useState(new FeedBody('', ''));

    const feedProvider = new FeedProvider();

    const openAddModal = () => {
        setFormData(new FeedBody('', ''));
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
            await feedProvider.create(formData);
            closeAddModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const openManageModal = async (feed: FeedResponse) => {
        const currentFeedObj = await feedProvider.details(feed.id, []);

        setCurrentFeed(currentFeedObj);
        setFormData(new FeedBody(currentFeedObj.text, ''));
        setGlobalError('');
        setFieldErrors({});
        setShowManage(true);
    };

    const closeManageModal = () => setShowManage(false);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentFeed) return;
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            formData.photo = formData.photo ? formData.photo : currentFeed.photo;
            await feedProvider.update(currentFeed.id, formData);
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
        if (!currentFeed) return;
        setLoading(true);
        setGlobalError('');
        try {
            await feedProvider.updateStatus(currentFeed.id, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentFeed) return;
        setLoading(true);
        setGlobalError('');
        try {
            await feedProvider.delete(currentFeed.id);
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
        showManage, openManageModal, closeManageModal, currentFeed,
        handleEditSubmit, handleStatusSubmit, handleDelete,
        formData, handleChange, loading, globalError, fieldErrors
    };
}