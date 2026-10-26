import { useState } from 'react';
import { Group, Text, Button, Badge, Modal, Stack, Alert, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDevices, IconTrash, IconPlus } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, pushSubscriptionService, type PushSubscriptionResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { PushSubscriptionStatusEnum } from '../../enums/PushSubscriptionStatusEnum';

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

export default function UserPushSubscriptions() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [opened, { open, close }] = useDisclosure(false);
    const [subscribing, setSubscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['push-subscriptions', currentUser?.id, page, limit],
        queryFn: () => {
            if (!currentUser?.id) return null;
            return pushSubscriptionService.getSubscriptions({
                page,
                limit,
            });
        },
        enabled: !!currentUser?.id,
    });

    const subs = data?.data ?? [];
    const pagination = data?.pagination;

    const handleSubscribeDevice = async () => {
        setSubscribing(true);
        setError(null);
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                throw new Error(t('pushNotSupported'));
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error(t('pushPermissionDenied'));
            }

            const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!vapidKey) {
                throw new Error(t('vapidMissing') || 'VAPID key missing');
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(vapidKey),
            });

            const keys = subscription.toJSON().keys ?? {};

            await pushSubscriptionService.createSubscription({
                endpoint: subscription.endpoint,
                p256dh: keys.p256dh || '',
                auth: keys.auth || '',
                userAgent: navigator.userAgent,
                status: PushSubscriptionStatusEnum.ACTIVE as any,
            });

            close();
            queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
            notifications.show({ title: t('pushSubscriptions'), message: t('saved'), color: 'green' });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubscribing(false);
        }
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => pushSubscriptionService.deleteSubscription(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
            notifications.show({ title: t('pushSubscriptions'), message: t('deleted'), color: 'blue' });
        },
    });

    const columns: Column<PushSubscriptionResource>[] = [
        {
            key: 'device',
            header: t('browserDevice'),
            render: (s) => (
                <Group gap="sm">
                    <ThemeIcon variant="light" color="blue" size="md">
                        <IconDevices size={18} />
                    </ThemeIcon>
                    <div>
                        <Text size="xs" lineClamp={1}>
                            {s.userAgent || t('unknown')}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                            {s.endpoint}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (s) => (
                <Badge size="xs" color={s.status === 1 ? 'green' : 'gray'} variant="light">
                    {s.status === 1 ? t('pushSubscriptionStatuses.active') : t('pushSubscriptionStatuses.inactive')}
                </Badge>
            ),
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (s) => (
                <Text size="xs" c="dimmed">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}
                </Text>
            ),
        },
    ];

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} />}
            <DataTable
                columns={columns}
                data={subs}
                isLoading={isLoading}
                page={page}
                totalItems={pagination?.total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                }}
                onAdd={open}
                addLabel={t('addSubscription')}
                actions={(s) => (
                    <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => deleteMutation.mutate(s.id)}
                    >
                        {t('delete')}
                    </Button>
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addSubscription')}>
                <Stack gap="sm">
                    <Text size="sm">{t('pushSubscriptionInfo')}</Text>
                    <Text size="xs" c="dimmed">
                        {t('pushPermissionWillBeAsked')}
                    </Text>

                    {error && <Alert color="red">{error}</Alert>}

                    <Button
                        mt="md"
                        loading={subscribing}
                        leftSection={<IconPlus size={16} />}
                        onClick={handleSubscribeDevice}
                    >
                        {t('subscribeThisDevice')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
