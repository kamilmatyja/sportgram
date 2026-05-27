import { useParams } from 'react-router-dom';
import { useUserFeeds } from '../services/useUserFeeds';
import { useFeedModals } from '../services/useFeedModals';
import { useFeedInteractions } from '../services/useFeedInteractions';
import { UserFeedsView } from '../components/UserFeedsView';
import { AddFeedModal } from '../components/AddFeedModal';
import { ManageFeedModal } from '../components/ManageFeedModal';

export default function UserFeeds() {
    const { link } = useParams<{ link: string }>();

    const feedsService = useUserFeeds(link);
    const modalsService = useFeedModals(feedsService.refreshFeeds);

    const baseInteractions = useFeedInteractions(
        feedsService.feeds,
        feedsService.currentUser,
        () => { feedsService.refreshFeeds(); }
    );

    const interactions = {
        ...baseInteractions,
        handleCommentStatusSubmit: modalsService.handleCommentStatusSubmit,
        handleReactionStatusSubmit: modalsService.handleReactionStatusSubmit,
    };

    return (
        <>
            <UserFeedsView
                user={feedsService.targetUser}
                currentUser={feedsService.currentUser}
                feeds={feedsService.feeds}
                relatedUsers={feedsService.relatedUsers}
                isMyProfile={feedsService.isMyProfile}
                isAdmin={feedsService.isAdmin}
                loading={feedsService.loading}
                error={feedsService.error}
                page={feedsService.page}
                limit={feedsService.limit}
                sort={feedsService.sort}
                filters={feedsService.filters}
                actionLoading={interactions.actionLoading}
                onFilterChange={feedsService.handleFilterChange}
                onSortChange={feedsService.handleSortChange}
                onLimitChange={feedsService.handleLimitChange}
                onPrevPage={feedsService.handlePrevPage}
                onNextPage={feedsService.handleNextPage}
                onAddClick={modalsService.openAddModal}
                onManageClick={modalsService.openManageModal}
                interactions={interactions}
            />

            <AddFeedModal
                user={feedsService.targetUser}
                show={modalsService.showAdd}
                closeModal={modalsService.closeAddModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleSubmit={modalsService.handleAddSubmit}
            />

            <ManageFeedModal
                user={feedsService.targetUser}
                show={modalsService.showManage}
                feed={modalsService.currentFeed}
                isMyProfile={feedsService.isMyProfile}
                isAdmin={feedsService.isAdmin}
                closeModal={modalsService.closeManageModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleEditSubmit={modalsService.handleEditSubmit}
                handleStatusSubmit={modalsService.handleStatusSubmit}
                handleDelete={modalsService.handleDelete}
                handleCommentStatusSubmit={modalsService.handleCommentStatusSubmit}
                handleReactionStatusSubmit={modalsService.handleReactionStatusSubmit}
            />
        </>
    );
}