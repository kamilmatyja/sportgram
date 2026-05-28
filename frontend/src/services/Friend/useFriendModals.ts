import React, {useState} from 'react';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FriendBody} from '../../api/body/FriendBody';
import {StatusBody} from '../../api/body/StatusBody';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {createFormHandler} from '../../utils/formHandler';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {FriendFilterQuery} from '../../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../../api/queries/FriendIndexQuery';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';

export function useFriendModals(onSuccess: () => void) {
    const { currentUser } = useAppAccess();

    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);
    const [currentFriend, setCurrentFriend] = useState<FriendResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [formData, setFormData] = useState(new FriendBody(''));

    const friendProvider = new FriendProvider();
    const userProvider = new UserProvider();

    const openAddModal = async () => {
        setFormData(new FriendBody(''));
        setGlobalError('');
        setFieldErrors({});
        setLoading(true);

        try {
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
                myFriends.forEach(f => {
                    friendIds.add(f.senderUserId);
                    friendIds.add(f.receiverUserId);
                });

                setAvailableUsers(allUsers.filter(u => u.id !== currentUser.id && !friendIds.has(u.id)));
            }
        } catch (e: any) {
            setGlobalError(e.error);
        } finally {
            setLoading(false);
            setShowAdd(true);
        }
    };

    const closeAddModal = () => setShowAdd(false);

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            await friendProvider.create(formData);
            closeAddModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const openManageModal = (friend: FriendResponse) => {
        setCurrentFriend(friend);
        setGlobalError('');
        setFieldErrors({});
        setShowManage(true);
    };

    const closeManageModal = () => setShowManage(false);

    const handleStatusSubmit = async (newStatus: number) => {
        if (!currentFriend) return;
        setLoading(true);
        setGlobalError('');
        try {
            await friendProvider.updateStatus(currentFriend.id, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentFriend) return;
        setLoading(true);
        setGlobalError('');
        try {
            await friendProvider.delete(currentFriend.id);
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
        showAdd, openAddModal, closeAddModal, handleAddSubmit, availableUsers,
        showManage, openManageModal, closeManageModal, currentFriend, handleStatusSubmit, handleDelete,
        formData, handleChange, loading, globalError, fieldErrors
    };
}