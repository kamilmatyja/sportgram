import {useParams} from 'react-router-dom';
import {useUserFriends} from '../services/useUserFriends';
import {useFriendModals} from '../services/useFriendModals';
import {UserFriendsView} from '../components/UserFriendsView';
import {AddFriendModal} from '../components/AddFriendModal';
import {ManageFriendModal} from '../components/ManageFriendModal';

export default function UserFriends() {
    const {link} = useParams<{ link: string }>();

    const friendsService = useUserFriends(link);
    const modalsService = useFriendModals(friendsService.refreshFriends);

    return (
        <>
            <UserFriendsView
                user={friendsService.targetUser}
                friends={friendsService.friends}
                isMyProfile={friendsService.isMyProfile}
                isAdmin={friendsService.isAdmin}
                loading={friendsService.loading}
                error={friendsService.error}
                page={friendsService.page}
                limit={friendsService.limit}
                sort={friendsService.sort}
                filters={friendsService.filters}
                onFilterChange={friendsService.handleFilterChange}
                onSortChange={friendsService.handleSortChange}
                onLimitChange={friendsService.handleLimitChange}
                onPrevPage={friendsService.handlePrevPage}
                onNextPage={friendsService.handleNextPage}
                onAddClick={modalsService.openAddModal}
                onManageClick={modalsService.openManageModal}
            />

            <AddFriendModal
                user={friendsService.targetUser}
                show={modalsService.showAdd}
                availableUsers={modalsService.availableUsers}
                closeModal={modalsService.closeAddModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleSubmit={modalsService.handleAddSubmit}
            />

            <ManageFriendModal
                user={friendsService.targetUser}
                show={modalsService.showManage}
                friend={modalsService.currentFriend}
                isMyProfile={friendsService.isMyProfile}
                closeModal={modalsService.closeManageModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                handleStatusSubmit={modalsService.handleStatusSubmit}
                handleDelete={modalsService.handleDelete}
            />
        </>
    );
}