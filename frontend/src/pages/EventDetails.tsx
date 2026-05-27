import {useParams} from 'react-router-dom';
import {useEventDetails} from '../services/Event/useEventDetails';
import {useEventModals} from '../services/Event/useEventModals';
import {useEventInteractions} from '../services/Event/useEventInteractions';
import {EventDetailsView} from '../components/Event/EventDetailsView';
import {EventListsModal} from '../components/Event/EventListsModal';
import {ManageEventModal} from '../components/Event/ManageEventModal';

export default function EventDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useEventDetails(link);
    const modalsService = useEventModals(detailsProps.refreshEvent, detailsProps.currentUser);

    const refreshAll = () => {
        detailsProps.refreshEvent();
        if (detailsProps.selectedDistanceId) {
            detailsProps.refreshLists(detailsProps.selectedDistanceId);
        }
    };

    const interactions = useEventInteractions(refreshAll);

    return (
        <>
            <EventDetailsView
                eventObj={detailsProps.eventObj}
                ownerPage={detailsProps.ownerPage}
                currentUser={detailsProps.currentUser}
                isMyProfile={detailsProps.isMyProfile}
                isAdmin={detailsProps.isAdmin}
                loading={detailsProps.loading}
                error={detailsProps.error}
                onManageClick={modalsService.openManageModal}
                openListsModal={detailsProps.openListsModal}
            />

            <ManageEventModal
                themeColor={detailsProps.ownerPage?.color}
                show={modalsService.showManage}
                currentEvent={modalsService.currentEvent}
                isMyProfile={detailsProps.isMyProfile}
                isAdmin={detailsProps.isAdmin}
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

            <EventListsModal
                show={detailsProps.showListsModal}
                onClose={detailsProps.closeListsModal}
                eventObj={detailsProps.eventObj}
                ownerPage={detailsProps.ownerPage}
                selectedDistanceId={detailsProps.selectedDistanceId}
                lists={detailsProps.distanceLists}
                relatedUsers={detailsProps.listUsers}
                currentUser={detailsProps.currentUser}
                isEventOwner={detailsProps.isMyProfile}
                isAdmin={detailsProps.isAdmin}
                isParticipant={detailsProps.isParticipant}
                loading={detailsProps.listsLoading}
                actionLoading={detailsProps.actionLoading || (interactions.actionLoading !== null)}
                onEnroll={() => detailsProps.handleEnroll(detailsProps.selectedDistanceId)}
                onUpdateStatus={detailsProps.handleListStatusUpdate}
                onDelete={detailsProps.handleDeleteList}
                interactions={interactions}
                refreshLists={() => detailsProps.refreshLists(detailsProps.selectedDistanceId)}
            />
        </>
    );
}