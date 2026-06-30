import React, { useState } from 'react';

import { FriendBody } from '../../api/body/FriendBody';
import { StatusBody } from '../../api/body/StatusBody';
import { FriendProvider } from '../../api/providers/FriendProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../../api/queries/FriendIndexQuery';
import { UserIndexQuery } from '../../api/queries/UserIndexQuery';
import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { createFormHandler } from '../../utils/formHandler';
import { useAppAccess } from '../../utils/hooks/useAppAccess';
import { useFormState } from '../../utils/hooks/useFormState';
import { useModal } from '../../utils/hooks/useModal';

export function useFriendModals(onSuccess: () => void) {
    const { currentUser } = useAppAccess();
    const addModal = useModal();
    const manageModal = useModal<FriendResponse>();
    const { loading, globalError, fieldErrors, wrap, resetErrors } = useFormState();

    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
    const [formData, setFormData] = useState(new FriendBody(''));

    const friendProvider = new FriendProvider();
    const userProvider = new UserProvider();

    const openAddModal = async () => {
        setFormData(new FriendBody(''));
        resetErrors();
        await wrap(async () => {
            if (currentUser) {
                const uIndexDto = new UserIndexQuery();
                uIndexDto.limit = 100;
                const allUsers = await userProvider.index(uIndexDto);
                const fFilterDto = new FriendFilterQuery();
                fFilterDto.userIds = [currentUser.id];
                const fIndexDto = new FriendIndexQuery();
                fIndexDto.limit = 100;
                fIndexDto.filter = fFilterDto;
                const myFriends = await friendProvider.index(fIndexDto);

                const friendIds = new Set<string>();
                myFriends.forEach((f) => {
                    friendIds.add(f.senderUserId);
                    friendIds.add(f.receiverUserId);
                });

                setAvailableUsers(allUsers.filter((u) => u.id !== currentUser.id && !friendIds.has(u.id)));
            }
        }).catch(() => {});
        addModal.open();
    };

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        wrap(async () => {
            await friendProvider.create(formData);
            addModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const openManageModal = (friend: FriendResponse) => {
        resetErrors();
        manageModal.open(friend);
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            await friendProvider.updateStatus(manageModal.data!.id, new StatusBody(newStatus));
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await friendProvider.delete(manageModal.data!.id);
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
        availableUsers,
        showManage: manageModal.isOpen,
        openManageModal,
        closeManageModal: manageModal.close,
        currentFriend: manageModal.data,
        handleStatusSubmit,
        handleDelete,
        formData,
        handleChange,
        loading,
        globalError,
        fieldErrors,
    };
}
