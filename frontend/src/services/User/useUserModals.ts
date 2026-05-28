import React, {useState} from 'react';
import {UserProvider} from '../../api/providers/UserProvider';
import {UserCreateBody} from '../../api/body/UserCreateBody';
import {UserUpdateBody} from '../../api/body/UserUpdateBody';
import {StatusBody} from '../../api/body/StatusBody';
import {UserResponse} from '../../api/responses/UserResponse';
import {createFormHandler} from '../../utils/formHandler';
import {useTranslation} from '../../context/TranslationContext';
import {useNavigate} from 'react-router-dom';
import {useModal} from '../../utils/hooks/useModal';
import {useFormState} from '../../utils/hooks/useFormState';

export function useUserModals(onSuccess: () => void) {
    const {t} = useTranslation();
    const navigate = useNavigate();

    const addModal = useModal();
    const manageModal = useModal<UserResponse>();
    const { loading, globalError, fieldErrors, wrap, resetErrors, setGlobalError } = useFormState();

    const [addFormData, setAddFormData] = useState(new UserCreateBody('', '', '', 0, 0, '', '', '', 0, 0, 0, 0, '', '', '', [], []));
    const [updateFormData, setUpdateFormData] = useState(new UserUpdateBody('', '', '', 0, 0, '', '', 0, 0, 0, 0, '', '', '', [], null, []));

    const userProvider = new UserProvider();

    const openAddModal = () => {
        setAddFormData(new UserCreateBody('', '', '', 0, 0, '', '', '', 0, 0, 0, 0, '', '', '', [], []));
        resetErrors();
        addModal.open();
    };

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!addFormData.profilePhoto || !addFormData.backgroundPhoto) {
            setGlobalError(t('photosRequired'));
            return;
        }
        wrap(async () => {
            await userProvider.create(addFormData);
            addModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const openManageModal = (user: UserResponse) => {
        resetErrors();
        manageModal.open(user);
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
    };

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!manageModal.data) return;
        wrap(async () => {
            updateFormData.profilePhoto = updateFormData.profilePhoto ? updateFormData.profilePhoto : manageModal.data!.profilePhoto;
            updateFormData.backgroundPhoto = updateFormData.backgroundPhoto ? updateFormData.backgroundPhoto : manageModal.data!.backgroundPhoto;
            await userProvider.update(manageModal.data!.id, updateFormData);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            await userProvider.updateStatus(manageModal.data!.id, new StatusBody(newStatus));
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await userProvider.delete(manageModal.data!.id);
            manageModal.close();
            navigate('/users');
        }).catch(() => {});
    };

    const handleAddChange = createFormHandler(setAddFormData);
    const handleUpdateChange = createFormHandler(setUpdateFormData);

    return {
        showAdd: addModal.isOpen, openAddModal, closeAddModal: addModal.close, addFormData, handleAddChange, handleAddSubmit,
        showManage: manageModal.isOpen, openManageModal, closeManageModal: manageModal.close, updateFormData, handleUpdateChange, handleEditSubmit,
        handleStatusSubmit, handleDelete, managedUser: manageModal.data,
        loading, globalError, fieldErrors
    };
}