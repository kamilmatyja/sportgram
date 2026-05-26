import {usePages} from '../services/usePages';
import {usePageModals} from '../services/usePageModals';
import {PagesListView} from '../components/PagesListView';
import {AddPageModal} from '../components/AddPageModal';

export default function PagesList() {
    const pagesService = usePages();
    const modalsService = usePageModals(pagesService.fetchPages);

    return (
        <>
            <PagesListView
                pages={pagesService.pages}
                isOrganizer={pagesService.isOrganizer}
                loading={pagesService.loading}
                error={pagesService.error}
                page={pagesService.page}
                limit={pagesService.limit}
                sort={pagesService.sort}
                filters={pagesService.filters}
                onFilterChange={pagesService.handleFilterChange}
                onSortChange={pagesService.handleSortChange}
                onLimitChange={pagesService.handleLimitChange}
                onPrevPage={pagesService.handlePrevPage}
                onNextPage={pagesService.handleNextPage}
                onAddClick={modalsService.openAddModal}
            />

            <AddPageModal
                user={pagesService.currentUser}
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
        </>
    );
}