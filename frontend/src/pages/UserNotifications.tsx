import {useParams} from 'react-router-dom';
import {useUserNotifications} from '../services/User/useUserNotifications';
import {useNotificationModals} from '../services/Notification/useNotificationModals';
import {UserNotificationsView} from '../components/User/UserNotificationsView';
import {ManageNotificationModal} from '../components/Notification/ManageNotificationModal';

export default function UserNotifications() {
    const {link} = useParams<{ link: string }>();

    const notificationsService = useUserNotifications(link);
    const modalsService = useNotificationModals(notificationsService.refreshNotifications);

    return (
        <>
            <UserNotificationsView
                user={notificationsService.targetUser}
                notifications={notificationsService.notifications}
                isMyProfile={notificationsService.isMyProfile}
                loading={notificationsService.loading}
                error={notificationsService.error}
                page={notificationsService.page}
                limit={notificationsService.limit}
                sort={notificationsService.sort}
                filters={notificationsService.filters}
                onFilterChange={notificationsService.handleFilterChange}
                onSortChange={notificationsService.handleSortChange}
                onLimitChange={notificationsService.handleLimitChange}
                onPrevPage={notificationsService.handlePrevPage}
                onNextPage={notificationsService.handleNextPage}
                onManageClick={modalsService.openManageModal}
            />

            <ManageNotificationModal
                user={notificationsService.targetUser}
                show={modalsService.showManage}
                notification={modalsService.currentNotification}
                isMyProfile={notificationsService.isMyProfile}
                closeModal={modalsService.closeManageModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                handleStatusSubmit={modalsService.handleStatusSubmit}
                handleDelete={modalsService.handleDelete}
            />
        </>
    );
}