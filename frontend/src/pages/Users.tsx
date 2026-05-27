import UsersView from '../components/User/UsersView';
import { AddUserModal } from '../components/User/AddUserModal';
import { useUsers } from '../services/User/useUsers';
import { useUserModals } from '../services/User/useUserModals';

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