import {useParams} from 'react-router-dom';
import {useEventDetails} from '../services/useEventDetails';
import {useEventModals} from '../services/useEventModals';
import {EventDetailsView} from '../components/EventDetailsView';
import {EventListsModal} from '../components/EventListsModal';
import {ManageEventModal} from '../components/ManageEventModal';

export default function EventDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useEventDetails(link);
    const modalsService = useEventModals(detailsProps.refreshEvent, detailsProps.currentUser);

    return (
        <>
            <EventDetailsView
                eventObj={detailsProps.eventObj}
                ownerPage={detailsProps.ownerPage}
                currentUser={detailsProps.currentUser}
                isMyProfile={detailsProps.isMyProfile}
                isAdmin={detailsProps.isAdmin}
                isParticipant={detailsProps.isParticipant}
                userEnrollments={detailsProps.userEnrollments}
                loading={detailsProps.loading}
                actionLoading={detailsProps.actionLoading}
                error={detailsProps.error}
                onManageClick={modalsService.openManageModal}
                handleEnroll={detailsProps.handleEnroll}
                openListsModal={detailsProps.openListsModal}
            />

            <ManageEventModal
                user={detailsProps.currentUser}
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

                selectedDistanceId={modalsService.selectedDistanceId}
                distanceLists={modalsService.distanceLists}
                listUsers={modalsService.listUsers}
                loadingLists={modalsService.loadingLists}
                fetchDistanceLists={modalsService.fetchDistanceLists}
                handleListStatusUpdate={modalsService.handleListStatusUpdate}

                activeResultListId={modalsService.activeResultListId}
                setActiveResultListId={modalsService.setActiveResultListId}
                resultFormData={modalsService.resultFormData}
                setResultFormData={modalsService.setResultFormData}
                openAddResultForm={modalsService.openAddResultForm}
                openEditResultForm={modalsService.openEditResultForm}
                handleSaveResult={modalsService.handleSaveResult}
                handleDeleteResult={modalsService.handleDeleteResult}
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
                actionLoading={detailsProps.actionLoading}
                onEnroll={() => detailsProps.handleEnroll(detailsProps.selectedDistanceId)}
                onUpdateStatus={detailsProps.handleListStatusUpdate}
                onDelete={detailsProps.handleDeleteList}
            />
        </>
    );
}