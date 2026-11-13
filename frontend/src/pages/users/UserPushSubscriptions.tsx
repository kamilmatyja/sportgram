import { useState, useMemo } from 'react';
import { Button, TextInput, Stack, Group, Text } from '@mantine/core';
import { InteractionModal as Modal } from '../../components/common/InteractionModal';
import { useDisclosure } from '@mantine/hooks';
import { IconDeviceMobile, IconPlus, IconEdit } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    pushSubscriptionService,
    type PushSubscriptionResource,
    type GetPushSubscriptionsQuery,
} from '../../api/services';
import {
    DataTable,
    type Column,
    StatusBadge,
    StatusActionMenu,
    EditActionButton,
    DeleteActionButton,
    UserSubpageContainer,
} from '../../components';
import { PushSubscriptionStatusEnum } from '../../enums/PushSubscriptionStatusEnum';
import { buildSortOptions, confirmDelete, formatDateTime, notifySuccess, notifyError } from '../../utils';
import { useDataTableState, useFormErrors } from '../../hooks';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const initialForm = {
    endpoint: '',
    p256dh: '',
    auth: '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
};

export default function UserPushSubscriptions() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [subscribing, setSubscribing] = useState(false);
    const [showManualCreate, setShowManualCreate] = useState(false);
    const [showManualEdit, setShowManualEdit] = useState(false);
    const tableState = useDataTableState({ initialSort: 'createdAt:desc' });

    const [endpointFilter, setEndpointFilter] = useState('');
    const [p256dhFilter, setP256dhFilter] = useState('');
    const [authFilter, setAuthFilter] = useState('');

    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [createForm, setCreateForm] = useState(initialForm);
    const createErrors = useFormErrors();

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingSub, setEditingSub] = useState<PushSubscriptionResource | null>(null);
    const [editForm, setEditForm] = useState(initialForm);
    const editErrors = useFormErrors();

    const activeFiltersCount = useMemo(
        () => [endpointFilter.trim(), p256dhFilter.trim(), authFilter.trim()].filter(Boolean).length,
        [endpointFilter, p256dhFilter, authFilter],
    );

    const handleResetFilters = () => {
        setEndpointFilter('');
        setP256dhFilter('');
        setAuthFilter('');
        tableState.resetPage();
    };

    const sortOptions = buildSortOptions(t, ['createdAt', 'endpoint', 'status']);

    return (
        <UserSubpageContainer ownerOrAdminOnly={true}>
            {({ targetUser, isOwner, isAdmin }) => {
                const canManage = isOwner || isAdmin;

                const queryFilter = {
                    userId: targetUser.id,
                    endpoint: endpointFilter.trim() || null,
                    p256dh: p256dhFilter.trim() || null,
                    auth: authFilter.trim() || null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'push-subscriptions',
                        targetUser.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () =>
                        pushSubscriptionService.getPushSubscriptions({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    sort:
                                        (tableState.sort as NonNullable<GetPushSubscriptionsQuery>['sort']) ??
                                        'createdAt:desc',
                                    filter: queryFilter,
                                },
                            },
                        }),
                });

                const subs = data?.data ?? [];
                const pagination = data?.pagination;

                const handleSubscribeDevice = async () => {
                    if (
                        typeof navigator === 'undefined' ||
                        !('serviceWorker' in navigator) ||
                        !('PushManager' in window)
                    ) {
                        notifications.show({
                            id: 'push-status-error',
                            color: 'red',
                            title: t('pushNotifications'),
                            message: t('pushPermissionDenied'),
                        });
                        return;
                    }

                    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                    if (!vapidPublicKey) {
                        notifyError(t('missingVapidKey'), t('error'));
                        return;
                    }

                    setSubscribing(true);

                    try {
                        if ('Notification' in window && Notification.permission !== 'granted') {
                            const permission = await Notification.requestPermission();
                            if (permission !== 'granted') {
                                notifications.show({
                                    id: 'push-status-error',
                                    color: 'red',
                                    title: t('pushNotifications'),
                                    message: t('pushPermissionDenied'),
                                });
                                return;
                            }
                        }
                        await navigator.serviceWorker.register('/sw.js');
                        const reg = await navigator.serviceWorker.ready;
                        const subscription =
                            (await reg.pushManager.getSubscription()) ??
                            (await reg.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                            }));

                        const keys = subscription.toJSON().keys ?? {};

                        await pushSubscriptionService.createPushSubscription({
                            body: {
                                endpoint: subscription.endpoint,
                                p256dh: keys.p256dh || '',
                                auth: keys.auth || '',
                                userAgent: navigator.userAgent,
                            },
                        });

                        closeCreate();
                        await queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifySuccess(t('saved'), t('pushSubscriptions'));
                    } catch {
                        notifications.show({
                            id: 'push-status-error',
                            color: 'red',
                            title: t('pushNotifications'),
                            message: t('pushPermissionDenied'),
                        });
                    } finally {
                        setSubscribing(false);
                    }
                };

                const handleSubscribeDeviceInEdit = async () => {
                    if (
                        typeof navigator === 'undefined' ||
                        !('serviceWorker' in navigator) ||
                        !('PushManager' in window)
                    ) {
                        notifications.show({
                            id: 'push-status-error',
                            color: 'red',
                            title: t('pushNotifications'),
                            message: t('pushPermissionDenied'),
                        });
                        return;
                    }

                    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                    if (!vapidPublicKey) {
                        notifyError(t('missingVapidKey'), t('error'));
                        return;
                    }

                    if (!editingSub) return;

                    setSubscribing(true);

                    try {
                        if ('Notification' in window && Notification.permission !== 'granted') {
                            const permission = await Notification.requestPermission();
                            if (permission !== 'granted') {
                                notifications.show({
                                    id: 'push-status-error',
                                    color: 'red',
                                    title: t('pushNotifications'),
                                    message: t('pushPermissionDenied'),
                                });
                                return;
                            }
                        }
                        await navigator.serviceWorker.register('/sw.js');
                        const reg = await navigator.serviceWorker.ready;
                        const subscription =
                            (await reg.pushManager.getSubscription()) ??
                            (await reg.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                            }));

                        const keys = subscription.toJSON().keys ?? {};

                        await pushSubscriptionService.updatePushSubscription({
                            params: { path: { id: editingSub.id } },
                            body: {
                                endpoint: subscription.endpoint,
                                p256dh: keys.p256dh || '',
                                auth: keys.auth || '',
                                userAgent: navigator.userAgent,
                            },
                        });

                        closeEdit();
                        setEditingSub(null);
                        await queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifySuccess(t('saved'), t('pushSubscriptions'));
                    } catch {
                        notifications.show({
                            id: 'push-status-error',
                            color: 'red',
                            title: t('pushNotifications'),
                            message: t('pushPermissionDenied'),
                        });
                    } finally {
                        setSubscribing(false);
                    }
                };

                const createManualMutation = useMutation({
                    mutationFn: () =>
                        pushSubscriptionService.createPushSubscription({
                            body: {
                                endpoint: createForm.endpoint,
                                p256dh: createForm.p256dh,
                                auth: createForm.auth,
                                userAgent: createForm.userAgent,
                            },
                        }),
                    onSuccess: () => {
                        closeCreate();
                        setCreateForm(initialForm);
                        createErrors.clearErrors();
                        void queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifySuccess(t('created'), t('pushSubscriptions'));
                    },
                    onError: (err) => createErrors.setFromError(err),
                });

                const handleOpenEdit = (sub: PushSubscriptionResource) => {
                    setEditingSub(sub);
                    setEditForm({
                        endpoint: sub.endpoint || '',
                        p256dh: sub.p256dh || '',
                        auth: sub.auth || '',
                        userAgent: sub.userAgent || '',
                    });
                    editErrors.clearErrors();
                    setShowManualEdit(false);
                    openEdit();
                };

                const updateMutation = useMutation({
                    mutationFn: async () => {
                        if (!editingSub) return;
                        await pushSubscriptionService.updatePushSubscription({
                            params: { path: { id: editingSub.id } },
                            body: {
                                endpoint: editForm.endpoint,
                                p256dh: editForm.p256dh,
                                auth: editForm.auth,
                                userAgent: editForm.userAgent,
                            },
                        });
                    },
                    onSuccess: () => {
                        closeEdit();
                        setEditingSub(null);
                        editErrors.clearErrors();
                        void queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifySuccess(t('saved'), t('pushSubscriptions'));
                    },
                    onError: (err) => editErrors.setFromError(err),
                });

                const updateStatusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: PushSubscriptionStatusEnum }) =>
                        pushSubscriptionService.updatePushSubscriptionStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifySuccess(t('statusUpdated'), t('pushSubscriptions'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        pushSubscriptionService.deletePushSubscription({ params: { path: { id } } }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifySuccess(t('deleted'), t('pushSubscriptions'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const columns: Column<PushSubscriptionResource>[] = [
                    {
                        key: 'device',
                        header: t('device'),
                        render: (s) => (
                            <Text size="sm" lineClamp={2} title={s.userAgent ?? ''}>
                                {s.userAgent ? s.userAgent.slice(0, 60) + '...' : t('unknownDevice')}
                            </Text>
                        ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (s) => <StatusBadge status={s.status} enumType={PushSubscriptionStatusEnum} />,
                    },
                    {
                        key: 'createdAt',
                        header: t('createdAt'),
                        render: (s) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(s.createdAt)}
                            </Text>
                        ),
                    },
                ];

                const filtersNode = (
                    <Group grow align="flex-start" gap="sm">
                        <TextInput
                            label={t('endpoint')}
                            value={endpointFilter}
                            onChange={(e) => {
                                setEndpointFilter(e.currentTarget.value);
                                tableState.resetPage();
                            }}
                        />
                        <TextInput
                            label={t('p256dh')}
                            value={p256dhFilter}
                            onChange={(e) => {
                                setP256dhFilter(e.currentTarget.value);
                                tableState.resetPage();
                            }}
                        />
                        <TextInput
                            label={t('authKey')}
                            value={authFilter}
                            onChange={(e) => {
                                setAuthFilter(e.currentTarget.value);
                                tableState.resetPage();
                            }}
                        />
                    </Group>
                );

                return (
                    <>
                        <DataTable
                            columns={columns}
                            data={subs}
                            isLoading={isLoading}
                            totalItems={pagination?.total}
                            state={tableState}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={
                                isOwner
                                    ? () => {
                                          createErrors.clearErrors();
                                          setShowManualCreate(false);
                                          openCreate();
                                      }
                                    : undefined
                            }
                            addLabel={t('addSubscription')}
                            actions={(s) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    {canManage && (
                                        <StatusActionMenu
                                            value={s.status}
                                            enumType={PushSubscriptionStatusEnum}
                                            onChange={(status) =>
                                                updateStatusMutation.mutate({
                                                    id: s.id,
                                                    status: status,
                                                })
                                            }
                                            loading={updateStatusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && <EditActionButton onClick={() => handleOpenEdit(s)} />}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => confirmDelete(t, () => deleteMutation.mutate(s.id))}
                                            loading={deleteMutation.isPending}
                                        />
                                    )}
                                </Group>
                            )}
                        />

                        <Modal opened={createOpened} onClose={closeCreate} title={t('addSubscription')}>
                            <Stack gap="xs">
                                <Group grow gap="xs">
                                    <Button
                                        size="xs"
                                        variant="light"
                                        leftSection={<IconDeviceMobile size={16} />}
                                        loading={subscribing}
                                        disabled={subscribing}
                                        onClick={() => {
                                            void handleSubscribeDevice();
                                        }}
                                    >
                                        {t('addAutomatically')}
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="default"
                                        leftSection={<IconPlus size={16} />}
                                        onClick={() => setShowManualCreate((prev) => !prev)}
                                    >
                                        {t('addManually')}
                                    </Button>
                                </Group>

                                {showManualCreate && (
                                    <Stack gap="sm">
                                        <TextInput
                                            label={t('endpoint')}
                                            placeholder="https://..."
                                            required
                                            value={createForm.endpoint}
                                            error={createErrors.errors.endpoint}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    endpoint: e.currentTarget.value,
                                                })
                                            }
                                        />
                                        <TextInput
                                            label={t('p256dh')}
                                            placeholder="p256dh..."
                                            required
                                            value={createForm.p256dh}
                                            error={createErrors.errors.p256dh}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    p256dh: e.currentTarget.value,
                                                })
                                            }
                                        />
                                        <TextInput
                                            label={t('authKey')}
                                            placeholder="auth..."
                                            required
                                            value={createForm.auth}
                                            error={createErrors.errors.auth}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    auth: e.currentTarget.value,
                                                })
                                            }
                                        />
                                        <TextInput
                                            label={t('device')}
                                            placeholder="User-Agent..."
                                            required
                                            value={createForm.userAgent}
                                            error={createErrors.errors.userAgent}
                                            onChange={(e) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    userAgent: e.currentTarget.value,
                                                })
                                            }
                                        />
                                        <Button
                                            mt="sm"
                                            loading={createManualMutation.isPending}
                                            disabled={
                                                createManualMutation.isPending ||
                                                !createForm.endpoint.trim() ||
                                                !createForm.p256dh.trim() ||
                                                !createForm.auth.trim() ||
                                                !createForm.userAgent.trim()
                                            }
                                            onClick={() => createManualMutation.mutate()}
                                        >
                                            {t('save')}
                                        </Button>
                                    </Stack>
                                )}
                            </Stack>
                        </Modal>

                        <Modal opened={editOpened} onClose={closeEdit} title={t('editSubscription')}>
                            <Stack gap="xs">
                                <Group grow gap="xs">
                                    <Button
                                        size="xs"
                                        variant="light"
                                        leftSection={<IconDeviceMobile size={16} />}
                                        loading={subscribing}
                                        disabled={subscribing}
                                        onClick={() => {
                                            void handleSubscribeDeviceInEdit();
                                        }}
                                    >
                                        {t('editAutomatically')}
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="default"
                                        leftSection={<IconEdit size={16} />}
                                        onClick={() => setShowManualEdit((prev) => !prev)}
                                    >
                                        {t('editManually')}
                                    </Button>
                                </Group>

                                {showManualEdit && (
                                    <Stack gap="sm">
                                        <TextInput
                                            label={t('endpoint')}
                                            required
                                            value={editForm.endpoint}
                                            error={editErrors.errors.endpoint}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, endpoint: e.currentTarget.value })
                                            }
                                        />
                                        <TextInput
                                            label={t('p256dh')}
                                            required
                                            value={editForm.p256dh}
                                            error={editErrors.errors.p256dh}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, p256dh: e.currentTarget.value })
                                            }
                                        />
                                        <TextInput
                                            label={t('authKey')}
                                            required
                                            value={editForm.auth}
                                            error={editErrors.errors.auth}
                                            onChange={(e) => setEditForm({ ...editForm, auth: e.currentTarget.value })}
                                        />
                                        <TextInput
                                            label={t('device')}
                                            required
                                            value={editForm.userAgent}
                                            error={editErrors.errors.userAgent}
                                            onChange={(e) =>
                                                setEditForm({
                                                    ...editForm,
                                                    userAgent: e.currentTarget.value,
                                                })
                                            }
                                        />
                                        <Button
                                            mt="md"
                                            loading={updateMutation.isPending}
                                            disabled={
                                                updateMutation.isPending ||
                                                !editForm.endpoint.trim() ||
                                                !editForm.p256dh.trim() ||
                                                !editForm.auth.trim() ||
                                                !editForm.userAgent.trim()
                                            }
                                            onClick={() => updateMutation.mutate()}
                                        >
                                            {t('save')}
                                        </Button>
                                    </Stack>
                                )}
                            </Stack>
                        </Modal>
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
