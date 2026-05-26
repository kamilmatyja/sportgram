import {useParams} from 'react-router-dom';
import {usePageDetails} from '../services/usePageDetails';
import {usePageModals} from '../services/usePageModals';
import {PageDetailsView} from '../components/PageDetailsView';
import {ManagePageModal} from '../components/ManagePageModal';

export default function PageDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = usePageDetails(link);
    const modalsService = usePageModals(detailsProps.refreshPage);

    return (
        <>
            <PageDetailsView
                pageObj={detailsProps.pageObj}
                ownerUser={detailsProps.ownerUser}
                relatedUsers={detailsProps.relatedUsers}
                isMyProfile={detailsProps.isMyProfile}
                isAdmin={detailsProps.isAdmin}
                isParticipantOfPage={detailsProps.isParticipantOfPage}
                myFollow={detailsProps.myFollow}
                followLoading={detailsProps.followLoading}
                handleToggleFollow={detailsProps.handleToggleFollow}
                loading={detailsProps.loading}
                error={detailsProps.error}
                onManageClick={modalsService.openManageModal}
                events={detailsProps.events}
                eventsLoading={detailsProps.eventsLoading}
                eventPage={detailsProps.eventPage}
                eventLimit={detailsProps.eventLimit}
                eventSort={detailsProps.eventSort}
                eventFilters={detailsProps.eventFilters}
                handleEventFilterChange={detailsProps.handleEventFilterChange}
                handleEventSortChange={detailsProps.handleEventSortChange}
                handleEventLimitChange={detailsProps.handleEventLimitChange}
                handleEventPrevPage={detailsProps.handleEventPrevPage}
                handleEventNextPage={detailsProps.handleEventNextPage}
            />

            <ManagePageModal
                user={detailsProps.ownerUser}
                currentUser={detailsProps.currentUser}
                availableUsers={modalsService.availableUsers}
                relatedUsers={detailsProps.relatedUsers}
                handleParticipantsChange={modalsService.handleParticipantsChange}
                show={modalsService.showManage}
                currentPageObj={modalsService.currentPage}
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
                handleParticipantStatusSubmit={modalsService.handleParticipantStatusSubmit}
                handleFollowStatusSubmit={modalsService.handleFollowStatusSubmit}
                handleDelete={modalsService.handleDelete}
            />
        </>
    );
}