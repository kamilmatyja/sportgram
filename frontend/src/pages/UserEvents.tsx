import { useParams } from 'react-router-dom';
import { useUserEvents } from '../services/useUserEvents';
import { useEventModals } from '../services/useEventModals';
import { useEventInteractions } from '../services/useEventInteractions';
import { UserEventsView } from '../components/UserEventsView';
import { AddEventModal } from '../components/AddEventModal';
import { ManageEventModal } from '../components/ManageEventModal';

export default function UserEvents() {
    const { link } = useParams<{ link: string }>();

    const eventsService = useUserEvents(link);
    const modalsService = useEventModals(eventsService.refreshEvents, eventsService.currentUser);
    const interactions = useEventInteractions(eventsService.refreshEvents);

    return (
        <>
            <UserEventsView
                user={eventsService.targetUser}
                events={eventsService.events}
                isMyProfile={eventsService.isMyProfile}
                isAdmin={eventsService.isAdmin}
                isOrganizer={eventsService.isOrganizer}
                loading={eventsService.loading}
                error={eventsService.error}
                page={eventsService.page}
                limit={eventsService.limit}
                sort={eventsService.sort}
                filters={eventsService.filters}
                onFilterChange={eventsService.handleFilterChange}
                onSortChange={eventsService.handleSortChange}
                onLimitChange={eventsService.handleLimitChange}
                onPrevPage={eventsService.handlePrevPage}
                onNextPage={eventsService.handleNextPage}
                onAddClick={modalsService.openAddModal}
                onManageClick={modalsService.openManageModal}
                interactions={interactions}
            />

            <AddEventModal
                user={eventsService.targetUser}
                show={modalsService.showAdd}
                myPages={modalsService.myPages}
                selectedPageId={modalsService.selectedPageId}
                setSelectedPageId={modalsService.setSelectedPageId}
                closeModal={modalsService.closeAddModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleSubmit={modalsService.handleAddSubmit}
                addDiscipline={modalsService.addDiscipline}
                updateDisciplineType={modalsService.updateDisciplineType}
                removeDiscipline={modalsService.removeDiscipline}
                addDistance={modalsService.addDistance}
                updateDistanceValue={modalsService.updateDistanceValue}
                removeDistance={modalsService.removeDistance}
                addSubDistance={modalsService.addSubDistance}
                updateSubDistanceValue={modalsService.updateSubDistanceValue}
                removeSubDistance={modalsService.removeSubDistance}
            />

            <ManageEventModal
                user={eventsService.targetUser}
                show={modalsService.showManage}
                currentEvent={modalsService.currentEvent}
                isMyProfile={eventsService.isMyProfile}
                isAdmin={eventsService.isAdmin}
                closeModal={modalsService.closeManageModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleEditSubmit={modalsService.handleEditSubmit}
                handleStatusSubmit={modalsService.handleStatusSubmit}
                handleDelete={modalsService.handleDelete}
                addDiscipline={modalsService.addDiscipline}
                updateDisciplineType={modalsService.updateDisciplineType}
                removeDiscipline={modalsService.removeDiscipline}
                addDistance={modalsService.addDistance}
                updateDistanceValue={modalsService.updateDistanceValue}
                removeDistance={modalsService.removeDistance}
                addSubDistance={modalsService.addSubDistance}
                updateSubDistanceValue={modalsService.updateSubDistanceValue}
                removeSubDistance={modalsService.removeSubDistance}
            />
        </>
    );
}