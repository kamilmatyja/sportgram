import {PushSubscriptionProvider} from '../../api/providers/PushSubscriptionProvider';
import {PushSubscriptionBody} from '../../api/body/PushSubscriptionBody';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {useTranslation} from '../../context/TranslationContext';
import {PushSubscriptionStatusEnum} from '../../enums/PushSubscriptionStatusEnum';
import {useModal} from '../../utils/hooks/useModal';
import {useFormState} from '../../utils/hooks/useFormState';

const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export function usePushSubscriptionModals(onSuccess: () => void) {
    const {t} = useTranslation();
    const addModal = useModal();
    const manageModal = useModal<PushSubscriptionResponse>();
    const { loading, globalError, wrap, resetErrors, setGlobalError } = useFormState();

    const pushSubscriptionProvider = new PushSubscriptionProvider();

    const openAddModal = () => {
        resetErrors();
        addModal.open();
    };

    const handleSubscribeDevice = async () => {
        wrap(async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                throw new Error(t('pushNotSupported'));
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error(t('pushPermissionDenied'));
            }

            const registration = await navigator.serviceWorker.ready;
            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!vapidKey) {
                throw new Error('VITE_VAPID_PUBLIC_KEY is missing in env config.');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(vapidKey)
            });

            const subData = JSON.parse(JSON.stringify(subscription));
            const endpoint = subData.endpoint;
            const p256dh = subData.keys.p256dh;
            const auth = subData.keys.auth;
            const userAgent = navigator.userAgent;

            const pushDto = new PushSubscriptionBody(
                endpoint,
                p256dh,
                auth,
                userAgent,
                PushSubscriptionStatusEnum.ACTIVE
            );

            await pushSubscriptionProvider.create(pushDto);
            addModal.close();
            onSuccess();
        }).catch((e: any) => setGlobalError(e.message || e.error));
    };

    const openManageModal = (subscription: PushSubscriptionResponse) => {
        resetErrors();
        manageModal.open(subscription);
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            const updatedDto = new PushSubscriptionBody(
                manageModal.data!.endpoint,
                manageModal.data!.p256dh,
                manageModal.data!.auth,
                manageModal.data!.userAgent,
                newStatus
            );
            await pushSubscriptionProvider.update(manageModal.data!.id, updatedDto);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await pushSubscriptionProvider.delete(manageModal.data!.id);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    return {
        showAdd: addModal.isOpen, openAddModal, closeAddModal: addModal.close, handleSubscribeDevice,
        showManage: manageModal.isOpen, openManageModal, closeManageModal: manageModal.close,
        currentSubscription: manageModal.data,
        handleStatusSubmit, handleDelete, loading, globalError
    };
}