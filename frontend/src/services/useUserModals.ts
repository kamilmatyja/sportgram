import React, {useState} from 'react';
import {UserProvider} from '../api/providers/UserProvider';
import {UserCreateBody} from '../api/body/UserCreateBody';
import {UserUpdateBody} from '../api/body/UserUpdateBody';
import {StatusBody} from '../api/body/StatusBody';
import {UserResponse} from '../api/responses/UserResponse';
import {createFormHandler} from '../utils/formHandler';
import {useTranslation} from '../context/TranslationContext';
import {useNavigate} from 'react-router-dom';

export function useUserModals(onSuccess: () => void) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);

    const [managedUser, setManagedUser] = useState<UserResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [addFormData, setAddFormData] = useState(new UserCreateBody('', '', '', 0, 0, '', '', '', 0, 0, 0, 0, '', '', '', [], []));
    const [updateFormData, setUpdateFormData] = useState(new UserUpdateBody('', '', '', 0, 0, '', '', 0, 0, 0, 0, '', '', '', [], null, []));

    const userProvider = new UserProvider();

    const openAddModal = () => {
        setAddFormData(new UserCreateBody('', '', '', 0, 0, '', '', '', 0, 0, 0, 0, '', '', '', [], []));
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

        if (!addFormData.profilePhoto || !addFormData.backgroundPhoto) {
            setGlobalError(t('photosRequired'));
            setLoading(false);
            return;
        }

        try {
            await userProvider.create(addFormData);
            closeAddModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const openManageModal = (user: UserResponse) => {
        setManagedUser(user);
        setUpdateFormData(new UserUpdateBody(
            user.birthAt.split('T')[0],
            user.firstName,
            user.lastName,
            user.gender,
            user.phone,
            user.email,
            user.link,
            user.language,
            user.country,
            user.theme,
            user.color,
            '',
            '',
            user.bio,
            user.roles?.map((r: any) => r.role) || [],
            null,
            user.disciplines?.map((d: any) => d.discipline) || []
        ));
        setGlobalError('');
        setFieldErrors({});
        setShowManage(true);
    };

    const closeManageModal = () => setShowManage(false);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!managedUser) return;
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            updateFormData.profilePhoto = updateFormData.profilePhoto ? updateFormData.profilePhoto : managedUser.profilePhoto;
            updateFormData.backgroundPhoto = updateFormData.backgroundPhoto ? updateFormData.backgroundPhoto : managedUser.backgroundPhoto;

            await userProvider.update(managedUser.id, updateFormData);
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
        if (!managedUser) return;
        setLoading(true);
        setGlobalError('');
        try {
            await userProvider.updateStatus(managedUser.id, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!managedUser) return;
        setLoading(true);
        setGlobalError('');
        try {
            await userProvider.delete(managedUser.id);
            closeManageModal();
            navigate('/users');
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChange = createFormHandler(setAddFormData);
    const handleUpdateChange = createFormHandler(setUpdateFormData);

    return {
        showAdd, openAddModal, closeAddModal, addFormData, handleAddChange, handleAddSubmit,
        showManage, openManageModal, closeManageModal, updateFormData, handleUpdateChange, handleEditSubmit,
        handleStatusSubmit, handleDelete, managedUser,
        loading, globalError, fieldErrors
    };
}