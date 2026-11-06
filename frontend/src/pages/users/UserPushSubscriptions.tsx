import { useState, useMemo } from 'react';
import { Button, SimpleGrid, TextInput, Modal, Stack, Group, Text, Divider, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconDeviceMobile } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import {
    pushSubscriptionService,
    type PushSubscriptionResource,
    type GetPushSubscriptionsQuery,
} from '../../api/services';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PushSubscriptionStatusEnum } from '../../enums/PushSubscriptionStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';

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

export default function UserPushSubscriptions() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [subscribing, setSubscribing] = useState(false);

    const { page, limit, sort, setPage, onLimitChange, onSortChange, resetPage } = useDataTableState({
        defaultSort: 'createdAt:desc',
    });

    const [endpointFilter, setEndpointFilter] = useState('');
    const [p256dhFilter, setP256dhFilter] = useState('');
    const [authFilter, setAuthFilter] = useState('');

    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [createForm, setCreateForm] = useState({
        endpoint: '',
        p256dh: '',
        auth: '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });
    const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingSub, setEditingSub] = useState<PushSubscriptionResource | null>(null);
    const [editForm, setEditForm] = useState({
        endpoint: '',
        p256dh: '',
        auth: '',
        userAgent: '',
    });
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (endpointFilter.trim()) count++;
        if (p256dhFilter.trim()) count++;
        if (authFilter.trim()) count++;
        return count;
    }, [endpointFilter, p256dhFilter, authFilter]);

    const handleResetFilters = () => {
        setEndpointFilter('');
        setP256dhFilter('');
        setAuthFilter('');
        resetPage();
    };

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'endpoint:asc', label: t('sort_endpoint_asc') },
        { value: 'endpoint:desc', label: t('sort_endpoint_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
    ];

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
                    queryKey: ['push-subscriptions', targetUser.id, page, limit, sort, queryFilter],
                    queryFn: () =>
                        pushSubscriptionService.getPushSubscriptions({
                            params: {
                                query: {
                                    page,
                                    limit,
                                    sort: (sort as NonNullable<GetPushSubscriptionsQuery>['sort']) ?? 'createdAt:desc',
                                    filter: queryFilter,
                                },
                            },
                        }),
                });

                const subs = data?.data ?? [];
                const pagination = data?.pagination;

                const handleSubscribeDevice = async () => {
                    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                        notifications.show({
                            title: t('error'),
                            message: t('pushNotificationsNotSupported'),
                            color: 'red',
                        });
                        return;
                    }

                    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                    if (!vapidPublicKey) {
                        notifications.show({
                            title: t('error'),
                            message: t('missingVapidKey'),
                            color: 'red',
                        });
                        return;
                    }

                    setSubscribing(true);

                    try {
                        if ('Notification' in window && Notification.permission !== 'granted') {
                            const permission = await Notification.requestPermission();
                            if (permission !== 'granted') {
                                throw new Error(t('pushNotificationsNotSupported'));
                            }
                        }
                        await navigator.serviceWorker.register('/sw.js');
                        const reg = await navigator.serviceWorker.ready;
                        const subscription = await reg.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                        });

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
                        queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifications.show({
                            title: t('pushSubscriptions'),
                            message: t('browserSubscriptionSaved'),
                            color: 'green',
                        });
                    } catch (err) {
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
                    } finally {
                        setSubscribing(false);
                    }
                };

                const createManualMutation = useMutation({
                    mutationFn: async () => {
                        await pushSubscriptionService.createPushSubscription({
                            body: {
                                endpoint: createForm.endpoint,
                                p256dh: createForm.p256dh,
                                auth: createForm.auth,
                                userAgent: createForm.userAgent,
                            },
                        });
                    },
                    onSuccess: () => {
                        closeCreate();
                        setCreateForm({
                            endpoint: '',
                            p256dh: '',
                            auth: '',
                            userAgent: navigator.userAgent || '',
                        });
                        setCreateFieldErrors({});
                        queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifications.show({
                            title: t('pushSubscriptions'),
                            message: t('browserAdded'),
                            color: 'green',
                        });
                    },
                    onError: (err) => {
                        const fe = extractFieldErrors(err);
                        setCreateFieldErrors(fe);
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
                    },
                });

                const handleOpenEdit = (sub: PushSubscriptionResource) => {
                    setEditingSub(sub);
                    setEditForm({
                        endpoint: sub.endpoint || '',
                        p256dh: sub.p256dh || '',
                        auth: sub.auth || '',
                        userAgent: sub.userAgent || '',
                    });
                    setEditFieldErrors({});
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
                        setEditFieldErrors({});
                        queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifications.show({
                            title: t('pushSubscriptions'),
                            message: t('browserUpdated'),
                            color: 'green',
                        });
                    },
                    onError: (err) => {
                        const fe = extractFieldErrors(err);
                        setEditFieldErrors(fe);
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
                    },
                });

                const updateStatusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: PushSubscriptionStatusEnum }) =>
                        pushSubscriptionService.updatePushSubscriptionStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifications.show({
                            title: t('pushSubscriptions'),
                            message: t('statusUpdated'),
                            color: 'green',
                        });
                    },
                    onError: (err) => {
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
                    },
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        pushSubscriptionService.deletePushSubscription({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
                        notifications.show({
                            title: t('pushSubscriptions'),
                            message: t('browserSubscriptionDeleted'),
                            color: 'green',
                        });
                    },
                    onError: (err) => {
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
                    },
                });

                const handleDelete = (id: string) => {
                    openConfirmActionModal({
                        title: t('confirmDeleteTitle'),
                        message: t('confirmDeleteMessage'),
                        confirmLabel: t('delete'),
                        cancelLabel: t('cancel'),
                        onConfirm: () => deleteMutation.mutate(id),
                    });
                };

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
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                        <TextInput
                            label={t('endpoint')}
                            value={endpointFilter}
                            onChange={(e) => {
                                setEndpointFilter(e.currentTarget.value);
                                resetPage();
                            }}
                        />
                        <TextInput
                            label={t('p256dh')}
                            value={p256dhFilter}
                            onChange={(e) => {
                                setP256dhFilter(e.currentTarget.value);
                                resetPage();
                            }}
                        />
                        <TextInput
                            label={t('authKey')}
                            value={authFilter}
                            onChange={(e) => {
                                setAuthFilter(e.currentTarget.value);
                                resetPage();
                            }}
                        />
                    </SimpleGrid>
                );

                return (
                    <>
                        <DataTable
                            columns={columns}
                            data={subs}
                            isLoading={isLoading}
                            page={page}
                            totalItems={pagination?.total}
                            onPageChange={setPage}
                            limit={limit}
                            onLimitChange={onLimitChange}
                            sort={sort}
                            onSortChange={onSortChange}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            hasActiveFilters={activeFiltersCount > 0}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={isOwner ? openCreate : undefined}
                            addLabel={t('addSubscription')}
                            actions={(s) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    {canManage && (
                                        <StatusActionMenu
                                            currentStatus={s.status}
                                            options={PushSubscriptionStatusEnum.getOptions(t)}
                                            onStatusChange={(status) =>
                                                updateStatusMutation.mutate({
                                                    id: s.id,
                                                    status: status as PushSubscriptionStatusEnum,
                                                })
                                            }
                                            isPending={updateStatusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && <EditActionButton onClick={() => handleOpenEdit(s)} />}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => handleDelete(s.id)}
                                            isPending={deleteMutation.isPending}
                                        />
                                    )}
                                </Group>
                            )}
                        />

                        <Modal opened={createOpened} onClose={closeCreate} title={t('addSubscription')} size="lg">
                            <Stack gap="md">
                                <Paper withBorder p="md" radius="md">
                                    <Stack gap="xs">
                                        <Text fw={600} size="sm">
                                            {t('subscribeThisDevice')}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {t('pushPermissionWillBeAsked')}
                                        </Text>
                                        <Button
                                            mt="xs"
                                            loading={subscribing}
                                            disabled={subscribing}
                                            leftSection={<IconDeviceMobile size={16} />}
                                            onClick={handleSubscribeDevice}
                                        >
                                            {t('subscribeThisDevice')}
                                        </Button>
                                    </Stack>
                                </Paper>

                                <Divider label={t('orManualEntry')} labelPosition="center" />

                                <Stack gap="sm">
                                    <TextInput
                                        label={t('endpoint')}
                                        placeholder="https://..."
                                        required
                                        value={createForm.endpoint}
                                        error={createFieldErrors.endpoint}
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
                                        error={createFieldErrors.p256dh}
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
                                        error={createFieldErrors.auth}
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
                                        error={createFieldErrors.userAgent}
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
                                            !createForm.auth.trim()
                                        }
                                        onClick={() => createManualMutation.mutate()}
                                    >
                                        {t('add')}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Modal>

                        <Modal opened={editOpened} onClose={closeEdit} title={t('editBrowser')} size="lg">
                            <Stack gap="sm">
                                <TextInput
                                    label={t('endpoint')}
                                    required
                                    value={editForm.endpoint}
                                    error={editFieldErrors.endpoint}
                                    onChange={(e) => setEditForm({ ...editForm, endpoint: e.currentTarget.value })}
                                />
                                <TextInput
                                    label={t('p256dh')}
                                    required
                                    value={editForm.p256dh}
                                    error={editFieldErrors.p256dh}
                                    onChange={(e) => setEditForm({ ...editForm, p256dh: e.currentTarget.value })}
                                />
                                <TextInput
                                    label={t('authKey')}
                                    required
                                    value={editForm.auth}
                                    error={editFieldErrors.auth}
                                    onChange={(e) => setEditForm({ ...editForm, auth: e.currentTarget.value })}
                                />
                                <TextInput
                                    label={t('device')}
                                    required
                                    value={editForm.userAgent}
                                    error={editFieldErrors.userAgent}
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
                                        !editForm.auth.trim()
                                    }
                                    onClick={() => updateMutation.mutate()}
                                >
                                    {t('save')}
                                </Button>
                            </Stack>
                        </Modal>
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
