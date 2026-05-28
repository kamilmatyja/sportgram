import React, {useState} from 'react';
import {PageProvider} from '../../api/providers/PageProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {PageBody} from '../../api/body/PageBody';
import {StatusBody} from '../../api/body/StatusBody';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {createFormHandler} from '../../utils/formHandler';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {FriendFilterQuery} from '../../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../../api/queries/FriendIndexQuery';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useModal} from '../../utils/hooks/useModal';
import {useFormState} from '../../utils/hooks/useFormState';

export function usePageModals(onSuccess: () => void) {
    const { currentUser } = useAppAccess();
    const addModal = useModal();
    const manageModal = useModal<PageResponse>();
    const { loading, globalError, fieldErrors, wrap, resetErrors } = useFormState();

    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
    const [formData, setFormData] = useState(new PageBody('', '', '', '', '', 0, []));

    const pageProvider = new PageProvider();
    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const loadAvailableFriends = async (currentUsr: UserResponse, pageObj?: PageResponse | null) => {
        const fFilter = new FriendFilterQuery();
        fFilter.userIds = [currentUsr.id];
        fFilter.status = FriendStatusEnum.ACCEPTED;
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilter;

        const myFriends = await friendProvider.index(fIndexDto);

        const userIdsToFetch = new Set<string>();
        myFriends.forEach(f => {
            if (f.senderUserId !== currentUsr.id) userIdsToFetch.add(f.senderUserId);
            if (f.receiverUserId !== currentUsr.id) userIdsToFetch.add(f.receiverUserId);
        });

        if (pageObj) {
            pageObj.participants.forEach(p => userIdsToFetch.add(p.userId));
        }

        const idsArray = Array.from(userIdsToFetch);
        if (idsArray.length > 0) {
            const usersMap = await fetchRelatedUsers(idsArray, {}, userProvider);
            setAvailableUsers(Object.values(usersMap));
        } else {
            setAvailableUsers([]);
        }
    };

    const openAddModal = async () => {
        setFormData(new PageBody('', '', '', '', '', 0, []));
        resetErrors();
        await wrap(async () => {
            if (currentUser) { await loadAvailableFriends(currentUser); }
        }).catch(() => {});
        addModal.open();
    };

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        wrap(async () => {
            await pageProvider.create(formData);
            addModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const openManageModal = async (page: PageResponse) => {
        manageModal.open(page);
        setFormData(new PageBody(
            page.title,
            page.description,
            page.link,
            '',
            '',
            page.color,
            page.participants.map(p => p.userId)
        ));
        resetErrors();
        await wrap(async () => {
            if (currentUser) { await loadAvailableFriends(currentUser, page); }
        }).catch(() => {});
    };

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!manageModal.data) return;
        wrap(async () => {
            formData.profilePhoto = formData.profilePhoto ? formData.profilePhoto : manageModal.data!.profilePhoto;
            formData.backgroundPhoto = formData.backgroundPhoto ? formData.backgroundPhoto : manageModal.data!.backgroundPhoto;
            await pageProvider.update(manageModal.data!.id, formData);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            await pageProvider.updateStatus(manageModal.data!.id, new StatusBody(newStatus));
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await pageProvider.delete(manageModal.data!.id);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleChange = createFormHandler(setFormData);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData(prev => ({...prev, participants: selected}));
    };

    return {
        showAdd: addModal.isOpen, openAddModal, closeAddModal: addModal.close, handleAddSubmit, availableUsers,
        showManage: manageModal.isOpen, openManageModal, closeManageModal: manageModal.close,
        handleEditSubmit, handleStatusSubmit, handleDelete,
        currentPageObj: manageModal.data, formData, handleChange, handleParticipantsChange, loading, globalError, fieldErrors
    };
}