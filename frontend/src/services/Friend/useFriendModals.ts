import { useState } from 'react';

import { FriendBody } from '../../api/body/FriendBody';
import { StatusBody } from '../../api/body/StatusBody';
import { FriendProvider } from '../../api/providers/FriendProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../../api/queries/FriendIndexQuery';
import { UserIndexQuery } from '../../api/queries/UserIndexQuery';
import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { getErrorMessage } from '../../utils/api';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useCrudModals } from '../../utils/hooks/useCrudModals';
import { fetchAllPages } from '../../utils/query';

const emptyFriendBody = () => new FriendBody('');

export function useFriendModals(onSuccess: () => void, currentUser: UserResponse | null) {
    const {
        addModal,
        manageModal,
        loading,
        globalError,
        fieldErrors,
        wrap,
        resetErrors,
        setGlobalError,
        submitAdd,
        submitManage,
    } = useCrudModals<FriendResponse>(onSuccess);

    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
    const [formData, setFormData] = useState(emptyFriendBody);

    const friendProvider = new FriendProvider();
    const userProvider = new UserProvider();

    const loadAvailableUsers = async (currentUsr: UserResponse) => {
        const fFilterDto = new FriendFilterQuery();
        fFilterDto.userIds = [currentUsr.id];
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilterDto;

        const [allUsers, myFriends] = await Promise.all([
            fetchAllPages(new UserIndexQuery(), (query) => userProvider.index(query)),
            fetchAllPages(fIndexDto, (query) => friendProvider.index(query)),
        ]);

        const friendIds = new Set(myFriends.flatMap((f) => [f.senderUserId, f.receiverUserId]));
        setAvailableUsers(allUsers.filter((u) => u.id !== currentUsr.id && !friendIds.has(u.id)));
    };

    const openAddModal = async () => {
        setFormData(emptyFriendBody());
        resetErrors();
        if (currentUser) {
            await wrap(() => loadAvailableUsers(currentUser)).catch((err) => setGlobalError(getErrorMessage(err)));
        }
        addModal.open();
    };

    const handleAddSubmit = createSubmitHandler(() => submitAdd(() => friendProvider.create(formData)));

    const openManageModal = (friend: FriendResponse) => {
        resetErrors();
        manageModal.open(friend);
    };

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((friend) => friendProvider.updateStatus(friend.id, new StatusBody(newStatus)));

    const handleDelete = () => submitManage((friend) => friendProvider.delete(friend.id));

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
