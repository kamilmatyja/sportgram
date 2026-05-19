import UsersView from '../components/UsersView';
import {AddUserModal} from '../components/AddUserModal';
import {useUsers} from '../services/useUsers';
import {useAddUser} from '../services/useAddUser';

export default function Users() {
    const usersService = useUsers();
    const addUserService = useAddUser(usersService.fetchUsers);

    return (
        <>
            <UsersView
                filters={usersService.filters}
                onFilterChange={usersService.handleFilterChange}
                sort={usersService.sort}
                onSortChange={usersService.handleSortChange}
                limit={usersService.limit}
                onLimitChange={usersService.handleLimitChange}
                users={usersService.users}
                loading={usersService.loading}
                error={usersService.error}
                page={usersService.page}
                onPrevPage={usersService.handlePrevPage}
                onNextPage={usersService.handleNextPage}
                isAdmin={usersService.isAdmin}
                onAddUserClick={addUserService.openModal}
            />

            <AddUserModal {...addUserService} />
        </>
    );
}