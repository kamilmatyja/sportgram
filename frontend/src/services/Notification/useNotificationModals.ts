import { StatusBody } from '../../api/body/StatusBody';
import { NotificationProvider } from '../../api/providers/NotificationProvider';
import { NotificationResponse } from '../../api/responses/NotificationResponse';
import { useCrudModals } from '../../utils/hooks/useCrudModals';

export function useNotificationModals(onSuccess: () => void) {
    const { manageModal, loading, globalError, resetErrors, submitManage } =
        useCrudModals<NotificationResponse>(onSuccess);

    const notificationProvider = new NotificationProvider();

    const openManageModal = (notification: NotificationResponse) => {
        resetErrors();
        manageModal.open(notification);
    };

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((notification) => notificationProvider.updateStatus(notification.id, new StatusBody(newStatus)));

    const handleDelete = () => submitManage((notification) => notificationProvider.delete(notification.id));

    return {
        showManage: manageModal.isOpen,
        openManageModal,
        closeManageModal: manageModal.close,
        currentNotification: manageModal.data,
        handleStatusSubmit,
        handleDelete,
        loading,
        globalError,
    };
}
