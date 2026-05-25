import React, {useState} from 'react';
import {PushSubscriptionProvider} from '../api/providers/PushSubscriptionProvider';
import {PushSubscriptionBody} from '../api/body/PushSubscriptionBody';
import {PushSubscriptionResponse} from '../api/responses/PushSubscriptionResponse';
import {createFormHandler} from '../utils/formHandler';
import {useTranslation} from '../context/TranslationContext';
import {PushSubscriptionStatusEnum} from '../enums/PushSubscriptionStatusEnum';

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
    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);
    const [currentSubscription, setCurrentSubscription] = useState<PushSubscriptionResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [formData, setFormData] = useState(new PushSubscriptionBody('', '', '', '', PushSubscriptionStatusEnum.ACTIVE));

    const pushSubscriptionProvider = new PushSubscriptionProvider();

    const openAddModal = () => {
        setGlobalError('');
        setFieldErrors({});
        setShowAdd(true);
    };

    const closeAddModal = () => setShowAdd(false);

    const handleSubscribeDevice = async () => {
        setLoading(true);
        setGlobalError('');
        try {
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
            closeAddModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.message || err.error || 'Subscription error');
        } finally {
            setLoading(false);
        }
    };

    const openManageModal = (subscription: PushSubscriptionResponse) => {
        setCurrentSubscription(subscription);
        setFormData(new PushSubscriptionBody(
            subscription.endpoint,
            subscription.p256dh,
            subscription.auth,
            subscription.userAgent || '',
            subscription.status
        ));
        setGlobalError('');
        setFieldErrors({});
        setShowManage(true);
    };

    const closeManageModal = () => setShowManage(false);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentSubscription) return;
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            await pushSubscriptionProvider.update(currentSubscription.id, formData);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!currentSubscription) return;
        setLoading(true);
        setGlobalError('');
        try {
            const updatedDto = new PushSubscriptionBody(
                currentSubscription.endpoint,
                currentSubscription.p256dh,
                currentSubscription.auth,
                currentSubscription.userAgent,
                newStatus
            );
            await pushSubscriptionProvider.update(currentSubscription.id, updatedDto);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentSubscription) return;
        setLoading(true);
        setGlobalError('');
        try {
            await pushSubscriptionProvider.delete(currentSubscription.id);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = createFormHandler(setFormData);

    return {
        showAdd, openAddModal, closeAddModal, handleSubscribeDevice,
        showManage, openManageModal, closeManageModal, currentSubscription,
        handleEditSubmit, handleStatusSubmit, handleDelete,
        formData, handleChange, loading, globalError, fieldErrors
    };
}