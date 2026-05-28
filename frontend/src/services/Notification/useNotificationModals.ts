import {NotificationProvider} from '../../api/providers/NotificationProvider';
import {NotificationResponse} from '../../api/responses/NotificationResponse';
import {StatusBody} from '../../api/body/StatusBody';
import {useModal} from '../../utils/hooks/useModal';
import {useFormState} from '../../utils/hooks/useFormState';

export function useNotificationModals(onSuccess: () => void) {
    const manageModal = useModal<NotificationResponse>();
    const { loading, globalError, wrap, resetErrors } = useFormState();

    const notificationProvider = new NotificationProvider();

    const openManageModal = (notification: NotificationResponse) => {
        resetErrors();
        manageModal.open(notification);
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            await notificationProvider.updateStatus(manageModal.data!.id, new StatusBody(newStatus));
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await notificationProvider.delete(manageModal.data!.id);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    return {
        showManage: manageModal.isOpen, openManageModal, closeManageModal: manageModal.close,
        currentNotification: manageModal.data,
        handleStatusSubmit, handleDelete, loading, globalError
    };
}