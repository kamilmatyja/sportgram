import { PushSubscriptionBody } from '../../api/body/PushSubscriptionBody';
import { PushSubscriptionProvider } from '../../api/providers/PushSubscriptionProvider';
import { PushSubscriptionResponse } from '../../api/responses/PushSubscriptionResponse';
import { useTranslation } from '../../context/TranslationContext';
import { PushSubscriptionStatusEnum } from '../../enums/PushSubscriptionStatusEnum';
import { useCrudModals } from '../../utils/hooks/useCrudModals';

const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export function usePushSubscriptionModals(onSuccess: () => void) {
    const { t } = useTranslation();
    const { addModal, manageModal, loading, globalError, resetErrors, submitAdd, submitManage } =
        useCrudModals<PushSubscriptionResponse>(onSuccess);

    const pushSubscriptionProvider = new PushSubscriptionProvider();

    const openAddModal = () => {
        resetErrors();
        addModal.open();
    };

    const handleSubscribeDevice = () =>
        submitAdd(async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                throw new Error(t('pushNotSupported'));
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error(t('pushPermissionDenied'));
            }

            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                throw new Error('VITE_VAPID_PUBLIC_KEY is missing in env config.');
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(vapidKey),
            });
            const keys = subscription.toJSON().keys ?? {};

            await pushSubscriptionProvider.create(
                new PushSubscriptionBody(
                    subscription.endpoint,
                    keys.p256dh,
                    keys.auth,
                    navigator.userAgent,
                    PushSubscriptionStatusEnum.ACTIVE,
                ),
            );
        });

    const openManageModal = (subscription: PushSubscriptionResponse) => {
        resetErrors();
        manageModal.open(subscription);
    };

    const handleStatusSubmit = (newStatus: number) =>
        submitManage((subscription) =>
            pushSubscriptionProvider.update(
                subscription.id,
                new PushSubscriptionBody(
                    subscription.endpoint,
                    subscription.p256dh,
                    subscription.auth,
                    subscription.userAgent,
                    newStatus,
                ),
            ),
        );

    const handleDelete = () => submitManage((subscription) => pushSubscriptionProvider.delete(subscription.id));

    return {
        showAdd: addModal.isOpen,
        openAddModal,
        closeAddModal: addModal.close,
        handleSubscribeDevice,
        showManage: manageModal.isOpen,
        openManageModal,
        closeManageModal: manageModal.close,
        currentSubscription: manageModal.data,
        handleStatusSubmit,
        handleDelete,
        loading,
        globalError,
    };
}
