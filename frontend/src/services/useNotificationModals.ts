import {useState} from 'react';
import {NotificationProvider} from '../api/providers/NotificationProvider';
import {NotificationResponse} from '../api/responses/NotificationResponse';
import {StatusBody} from '../api/body/StatusBody';

export function useNotificationModals(onSuccess: () => void) {
    const [showManage, setShowManage] = useState(false);
    const [currentNotification, setCurrentNotification] = useState<NotificationResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');

    const notificationProvider = new NotificationProvider();

    const openManageModal = (notification: NotificationResponse) => {
        setCurrentNotification(notification);
        setGlobalError('');
        setShowManage(true);
    };

    const closeManageModal = () => setShowManage(false);

    const handleStatusSubmit = async (newStatus: number) => {
        if (!currentNotification) return;
        setLoading(true);
        setGlobalError('');
        try {
            await notificationProvider.updateStatus(currentNotification.id, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentNotification) return;
        setLoading(true);
        setGlobalError('');
        try {
            await notificationProvider.delete(currentNotification.id);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    return {
        showManage, openManageModal, closeManageModal, currentNotification,
        handleStatusSubmit, handleDelete, loading, globalError
    };
}