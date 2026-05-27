import { useEvents } from '../services/useEvents';
import { useEventModals } from '../services/useEventModals';
import { EventsListView } from '../components/EventsListView';
import { AddEventModal } from '../components/AddEventModal';

export default function EventsList() {
    const eventsService = useEvents();
    // modalsService potrzebuje funkcji odświeżającej i informacji o zalogowanym użytkowniku
    const modalsService = useEventModals(eventsService.fetchEvents, eventsService.currentUser);

    return (
        <>
            <EventsListView
                events={eventsService.events}
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
            />

            <AddEventModal
                user={eventsService.currentUser}
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
        </>
    );
}