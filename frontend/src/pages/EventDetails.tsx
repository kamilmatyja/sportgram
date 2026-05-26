import {useParams} from 'react-router-dom';
import {useEventDetails} from '../services/useEventDetails';
import {EventDetailsView} from '../components/EventDetailsView';
import {EventListsModal} from '../components/EventListsModal';

export default function EventDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useEventDetails(link);

    return (
        <>
            <EventDetailsView {...detailsProps} />
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
                onEnroll={detailsProps.handleEnroll}
                onUpdateStatus={detailsProps.handleListStatusUpdate}
                onDelete={detailsProps.handleDeleteList}
            />
        </>
    );
}