import React, {useState} from 'react';
import {PageProvider} from '../api/providers/PageProvider';
import {UserProvider} from '../api/providers/UserProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {PageBody} from '../api/body/PageBody';
import {StatusBody} from '../api/body/StatusBody';
import {PageResponse} from '../api/responses/PageResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {createFormHandler} from '../utils/formHandler';
import {useCheckPermission} from '../utils/checkPermission';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {FriendFilterQuery} from '../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';

export function usePageModals(onSuccess: () => void) {
    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);

    const [currentPage, setCurrentPage] = useState<PageResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [formData, setFormData] = useState(new PageBody('', '', '', '', '', 0, []));

    const pageProvider = new PageProvider();
    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();
    const {getCurrentUser} = useCheckPermission();

    const loadAvailableFriends = async (currentUser: UserResponse, pageObj?: PageResponse | null) => {
        const fFilter = new FriendFilterQuery();
        fFilter.userIds = [currentUser.id];
        fFilter.status = FriendStatusEnum.ACCEPTED;
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilter;

        const myFriends = await friendProvider.index(fIndexDto);

        const userIdsToFetch = new Set<string>();
        myFriends.forEach(f => {
            if (f.senderUserId !== currentUser.id) userIdsToFetch.add(f.senderUserId);
            if (f.receiverUserId !== currentUser.id) userIdsToFetch.add(f.receiverUserId);
        });

        if (pageObj) {
            pageObj.participants.forEach(p => userIdsToFetch.add(p.userId));
            pageObj.follows?.forEach(f => userIdsToFetch.add(f.userId));
        }

        const idsArray = Array.from(userIdsToFetch);
        if (idsArray.length > 0) {
            const uFilter = new UserFilterQuery();
            uFilter.userIds = idsArray;
            const uIndexDto = new UserIndexQuery();
            uIndexDto.filter = uFilter;
            uIndexDto.limit = idsArray.length;
            const fetchedUsers = await userProvider.index(uIndexDto);
            setAvailableUsers(fetchedUsers);
        } else {
            setAvailableUsers([]);
        }
    };

    const openAddModal = async () => {
        setFormData(new PageBody('', '', '', '', '', 0, []));
        setGlobalError('');
        setFieldErrors({});
        setLoading(true);

        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                await loadAvailableFriends(currentUser);
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
            await pageProvider.create(formData);
            closeAddModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const openManageModal = async (page: PageResponse) => {
        setCurrentPage(page);
        setFormData(new PageBody(
            page.title,
            page.description,
            page.link,
            '',
            '',
            page.color,
            page.participants.map(p => p.userId)
        ));
        setGlobalError('');
        setFieldErrors({});
        setLoading(true);

        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                await loadAvailableFriends(currentUser, page);
            }
        } catch (e: any) {
            setGlobalError(e.error);
        } finally {
            setLoading(false);
            setShowManage(true);
        }
    };

    const closeManageModal = () => setShowManage(false);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentPage) return;
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            formData.profilePhoto = formData.profilePhoto ? formData.profilePhoto : currentPage.profilePhoto;
            formData.backgroundPhoto = formData.backgroundPhoto ? formData.backgroundPhoto : currentPage.backgroundPhoto;
            await pageProvider.update(currentPage.id, formData);
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
        if (!currentPage) return;
        setLoading(true);
        setGlobalError('');
        try {
            await pageProvider.updateStatus(currentPage.id, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleParticipantStatusSubmit = async (participantId: string, newStatus: number) => {
        setLoading(true);
        setGlobalError('');
        try {
            await pageProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowStatusSubmit = async (followId: string, newStatus: number) => {
        setLoading(true);
        setGlobalError('');
        try {
            await pageProvider.updateFollowStatus(followId, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentPage) return;
        setLoading(true);
        setGlobalError('');
        try {
            await pageProvider.delete(currentPage.id);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = createFormHandler(setFormData);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData(prev => ({...prev, participants: selected}));
    };

    return {
        showAdd, openAddModal, closeAddModal, handleAddSubmit, availableUsers,
        showManage, openManageModal, closeManageModal, handleEditSubmit, handleStatusSubmit, handleDelete,
        handleParticipantStatusSubmit, handleFollowStatusSubmit,
        currentPage, formData, handleChange, handleParticipantsChange, loading, globalError, fieldErrors
    };
}