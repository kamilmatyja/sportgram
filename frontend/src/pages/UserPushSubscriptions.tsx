import {useParams} from 'react-router-dom';
import {useUserPushSubscriptions} from '../services/useUserPushSubscriptions';
import {usePushSubscriptionModals} from '../services/usePushSubscriptionModals';
import {UserPushSubscriptionsView} from '../components/UserPushSubscriptionsView';
import {AddPushSubscriptionModal} from '../components/AddPushSubscriptionModal';
import {ManagePushSubscriptionModal} from '../components/ManagePushSubscriptionModal';

export default function UserPushSubscriptions() {
    const {link} = useParams<{ link: string }>();

    const pushService = useUserPushSubscriptions(link);
    const modalsService = usePushSubscriptionModals(pushService.refreshSubscriptions);

    return (
        <>
            <UserPushSubscriptionsView
                user={pushService.targetUser}
                subscriptions={pushService.subscriptions}
                isMyProfile={pushService.isMyProfile}
                isAdmin={pushService.isAdmin}
                loading={pushService.loading}
                error={pushService.error}
                page={pushService.page}
                limit={pushService.limit}
                sort={pushService.sort}
                filters={pushService.filters}
                onFilterChange={pushService.handleFilterChange}
                onSortChange={pushService.handleSortChange}
                onLimitChange={pushService.handleLimitChange}
                onPrevPage={pushService.handlePrevPage}
                onNextPage={pushService.handleNextPage}
                onAddClick={modalsService.openAddModal}
                onManageClick={modalsService.openManageModal}
            />

            <AddPushSubscriptionModal
                user={pushService.targetUser}
                show={modalsService.showAdd}
                closeModal={modalsService.closeAddModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                handleSubscribeDevice={modalsService.handleSubscribeDevice}
            />

            <ManagePushSubscriptionModal
                user={pushService.targetUser}
                show={modalsService.showManage}
                subscription={modalsService.currentSubscription}
                isMyProfile={pushService.isMyProfile}
                isAdmin={pushService.isAdmin}
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