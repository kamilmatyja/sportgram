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
    const [statusData, setStatusData] = useState(new StatusBody(''));

    const feedProvider = new FeedProvider();

    const openAddModal = () => {
        setFormData(formData);
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

    const openManageModal = (feed: FeedResponse) => {
        setCurrentFeed(feed);
        setFormData(formData);
        setStatusData(new StatusBody(feed.status));
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

    const handleStatusSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentFeed) return;
        setLoading(true);
        try {
            await feedProvider.updateStatus(currentFeed.id, statusData);
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
    const handleStatusChange = createFormHandler(setStatusData);

    return {
        showAdd, openAddModal, closeAddModal, handleAddSubmit,
        showManage, openManageModal, closeManageModal, currentFeed, handleEditSubmit, handleStatusSubmit, handleDelete,
        formData, statusData, handleStatusChange, handleChange, loading, globalError, fieldErrors
    };
}