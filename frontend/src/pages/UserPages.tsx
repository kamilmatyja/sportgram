import {useParams} from 'react-router-dom';
import {useUserPages} from '../services/User/useUserPages';
import {usePageModals} from '../services/Page/usePageModals';
import {usePageInteractions} from '../services/Page/usePageInteractions';
import {UserPagesView} from '../components/User/UserPagesView';
import {AddPageModal} from '../components/Page/AddPageModal';
import {ManagePageModal} from '../components/Page/ManagePageModal';

export default function UserPages() {
    const {link} = useParams<{ link: string }>();

    const pagesService = useUserPages(link);
    const modalsService = usePageModals(pagesService.refreshPages);
    const interactions = usePageInteractions(pagesService.refreshPages);

    return (
        <>
            <UserPagesView
                user={pagesService.targetUser}
                currentUser={pagesService.currentUser}
                pages={pagesService.pages}
                relatedUsers={pagesService.relatedUsers}
                isMyProfile={pagesService.isMyProfile}
                isAdmin={pagesService.isAdmin}
                isOrganizer={pagesService.isOrganizer}
                loading={pagesService.loading}
                error={pagesService.error}
                page={pagesService.page}
                limit={pagesService.limit}
                sort={pagesService.sort}
                filters={pagesService.filters}
                actionLoading={interactions.actionLoading}
                onFilterChange={pagesService.handleFilterChange}
                onSortChange={pagesService.handleSortChange}
                onLimitChange={pagesService.handleLimitChange}
                onPrevPage={pagesService.handlePrevPage}
                onNextPage={pagesService.handleNextPage}
                onAddClick={modalsService.openAddModal}
                onManageClick={modalsService.openManageModal}
                interactions={interactions}
            />

            <AddPageModal
                themeColor={pagesService.targetUser?.color}
                show={modalsService.showAdd}
                availableUsers={modalsService.availableUsers}
                closeModal={modalsService.closeAddModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleParticipantsChange={modalsService.handleParticipantsChange}
                handleSubmit={modalsService.handleAddSubmit}
            />

            <ManagePageModal
                themeColor={pagesService.targetUser?.color}
                availableUsers={modalsService.availableUsers}
                handleParticipantsChange={modalsService.handleParticipantsChange}
                show={modalsService.showManage}
                currentPageObj={modalsService.currentPage}
                isMyProfile={pagesService.isMyProfile}
                isAdmin={pagesService.isAdmin}
                closeModal={modalsService.closeManageModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleEditSubmit={modalsService.handleEditSubmit}
                handleStatusSubmit={modalsService.handleStatusSubmit}
                handleDelete={modalsService.handleDelete}
            />
        </>
    );
}