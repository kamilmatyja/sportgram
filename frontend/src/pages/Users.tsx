import UsersView from '../components/UsersView';
import { AddUserModal } from '../components/AddUserModal';
import { useUsers } from '../services/useUsers';
import { useUserModals } from '../services/useUserModals';

export default function Users() {
    const usersService = useUsers();
    const modalsService = useUserModals(usersService.fetchUsers);

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
                onAddUserClick={modalsService.openAddModal}
            />

            <AddUserModal
                currentUser={usersService.currentUser}
                show={modalsService.showAdd}
                closeModal={modalsService.closeAddModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.addFormData}
                handleChange={modalsService.handleAddChange}
                handleSubmit={modalsService.handleAddSubmit}
            />
        </>
    );
}