import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { StatusBody } from '../../api/body/StatusBody';
import { UserCreateBody } from '../../api/body/UserCreateBody';
import { UserUpdateBody } from '../../api/body/UserUpdateBody';
import { UserProvider } from '../../api/providers/UserProvider';
import { UserResponse } from '../../api/responses/UserResponse';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useCrudModals } from '../../utils/hooks/useCrudModals';

const emptyUserCreateBody = () => new UserCreateBody('', '', '', 0, 0, '', '', '', 0, 0, 0, 0, '', '', '', [], []);
const emptyUserUpdateBody = () => new UserUpdateBody('', '', '', 0, 0, '', '', 0, 0, 0, 0, '', '', '', [], null, []);

export function useUserModals(onSuccess: () => void) {
    const navigate = useNavigate();
    const { addModal, manageModal, loading, globalError, fieldErrors, resetErrors, submitAdd, submitManage } =
        useCrudModals<UserResponse>(onSuccess);

    const [addFormData, setAddFormData] = useState(emptyUserCreateBody);
    const [updateFormData, setUpdateFormData] = useState(emptyUserUpdateBody);

    const userProvider = new UserProvider();

    const openAddModal = () => {
        setAddFormData(emptyUserCreateBody());
        resetErrors();
        addModal.open();
    };

    const handleAddSubmit = createSubmitHandler(() => {
        if (!addFormData.profilePhoto || !addFormData.backgroundPhoto) return;
        return submitAdd(() => userProvider.create(addFormData));
    });

    const openManageModal = (user: UserResponse) => {
        resetErrors();
        manageModal.open(user);
        setUpdateFormData(
            new UserUpdateBody(
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
                user.roles?.map((r) => r.role) || [],
                null,
                user.disciplines?.map((d) => d.discipline) || [],
            ),
        );
    };

    const handleEditSubmit = createSubmitHandler(() =>
        submitManage((user) =>
            userProvider.update(user.id, {
                ...updateFormData,
                profilePhoto: updateFormData.profilePhoto || user.profilePhoto,
                backgroundPhoto: updateFormData.backgroundPhoto || user.backgroundPhoto,
            }),
        ),
    );

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((user) => userProvider.updateStatus(user.id, new StatusBody(newStatus)));

    const handleDelete = () =>
        submitManage(
            (user) => userProvider.delete(user.id),
            () => navigate('/users'),
        );

    const handleAddChange = createFormHandler(setAddFormData);
    const handleUpdateChange = createFormHandler(setUpdateFormData);

    return {
        showAdd: addModal.isOpen,
        openAddModal,
        closeAddModal: addModal.close,
        addFormData,
        handleAddChange,
        handleAddSubmit,
        showManage: manageModal.isOpen,
        openManageModal,
        closeManageModal: manageModal.close,
        updateFormData,
        handleUpdateChange,
        handleEditSubmit,
        handleStatusSubmit,
        handleDelete,
        managedUser: manageModal.data,
        loading,
        globalError,
        fieldErrors,
    };
}
