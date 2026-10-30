import { useState, useMemo } from 'react';
import {
    Badge,
    Button,
    SimpleGrid,
    TextInput,
    Modal,
    Stack,
    Group,
    ActionIcon,
    Tooltip,
    Center,
    Loader,
    Text,
    Menu,
    Divider,
    Paper,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconEdit, IconAdjustments, IconDeviceMobile } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import {
    pushSubscriptionService,
    userService,
    type PushSubscriptionResource,
    type GetPushSubscriptionsQuery,
} from '../../api/services';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import UserProfileNav from '../../components/UserProfileNav';
import NotFound from '../../components/NotFound';
import { PushSubscriptionStatusEnum } from '../../enums/PushSubscriptionStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';

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
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [subscribing, setSubscribing] = useState(false);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [endpointFilter, setEndpointFilter] = useState('');
    const [p256dhFilter, setP256dhFilter] = useState('');
    const [authFilter, setAuthFilter] = useState('');

    // Create modal
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [createForm, setCreateForm] = useState({
        endpoint: '',
        p256dh: '',
        auth: '',
        userAgent: navigator.userAgent || '',
    });
    const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

    // Edit modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingSub, setEditingSub] = useState<PushSubscriptionResource | null>(null);
    const [editForm, setEditForm] = useState({
        endpoint: '',
        p256dh: '',
        auth: '',
        userAgent: '',
    });
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const {
        isOwner,
        isAdmin,
        canAccessSubpage,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser,
        ownerOrAdminOnly: true,
    });

    const canManage = isOwner || isAdmin;

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
        setPage(1);
    };

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'endpoint:asc', label: t('sort_endpoint_asc') },
        { value: 'endpoint:desc', label: t('sort_endpoint_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
    ];

    const queryFilter = useMemo(() => {
        return {
            userId: targetUser?.id ? targetUser.id : null,
            endpoint: endpointFilter.trim() || null,
            p256dh: p256dhFilter.trim() || null,
            auth: authFilter.trim() || null,
        };
    }, [targetUser?.id, endpointFilter, p256dhFilter, authFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['push-subscriptions', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () =>
            pushSubscriptionService.getSubscriptions({
                page,
                limit,
                sort: (sort as NonNullable<GetPushSubscriptionsQuery>['sort']) ?? 'createdAt:desc',
                filter: queryFilter,
            }),
        enabled: !!targetUser?.id && canAccessSubpage,
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
            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            const keys = subscription.toJSON().keys ?? {};

            await pushSubscriptionService.createSubscription({
                endpoint: subscription.endpoint,
                p256dh: keys.p256dh || '',
                auth: keys.auth || '',
                userAgent: navigator.userAgent,
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
                endpoint: createForm.endpoint,
                p256dh: createForm.p256dh,
                auth: createForm.auth,
                userAgent: createForm.userAgent,
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
            await pushSubscriptionService.updatePushSubscription(editingSub.id, {
                endpoint: editForm.endpoint,
                p256dh: editForm.p256dh,
                auth: editForm.auth,
                userAgent: editForm.userAgent,
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
            pushSubscriptionService.updateSubscriptionStatus(id, status),
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
        mutationFn: (id: string) => pushSubscriptionService.deleteSubscription(id),
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
            render: (s) => (
                <StatusBadge
                    status={s.status}
                    label={
                        s.status === PushSubscriptionStatusEnum.ACTIVE
                            ? t('pushSubscriptionStatuses.active')
                            : t('pushSubscriptionStatuses.rejected')
                    }
                />
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
        {
            key: 'keys',
            header: t('keysPresent'),
            render: (s) => (
                <Badge size="xs" variant="outline" color={s.p256dh && s.auth ? 'green' : 'gray'}>
                    {s.p256dh && s.auth ? t('valid') : t('incomplete')}
                </Badge>
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
                    setPage(1);
                }}
            />
            <TextInput
                label={t('p256dh')}
                value={p256dhFilter}
                onChange={(e) => {
                    setP256dhFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('authKey')}
                value={authFilter}
                onChange={(e) => {
                    setAuthFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
        </SimpleGrid>
    );

    if (userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
    }

    if (!canAccessSubpage) {
        return <NotFound title={t('accessDenied')} />;
    }

    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={isOwner} />
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
                sort={sort}
                onSortChange={(s) => {
                    setSort(s);
                    setPage(1);
                }}
                sortOptions={sortOptions}
                filtersNode={filtersNode}
                hasActiveFilters={activeFiltersCount > 0}
                activeFiltersCount={activeFiltersCount}
                onResetFilters={handleResetFilters}
                onAdd={isOwner ? openCreate : undefined}
                addLabel={t('addBrowser')}
                actions={(s) => (
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        {canManage && (
                            <>
                                <Menu shadow="md" width={160}>
                                    <Menu.Target>
                                        <Tooltip label={t('changeStatus')} withArrow>
                                            <ActionIcon variant="light" size={30} aria-label={t('changeStatus')}>
                                                <IconAdjustments size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        {PushSubscriptionStatusEnum.getOptions(t).map((opt) => (
                                            <Menu.Item
                                                key={opt.value}
                                                disabled={s.status === opt.value || updateStatusMutation.isPending}
                                                onClick={() =>
                                                    updateStatusMutation.mutate({
                                                        id: s.id,
                                                        status: opt.value as PushSubscriptionStatusEnum,
                                                    })
                                                }
                                            >
                                                {opt.label}
                                            </Menu.Item>
                                        ))}
                                    </Menu.Dropdown>
                                </Menu>

                                <Tooltip label={t('editBrowser')} withArrow>
                                    <ActionIcon
                                        variant="light"
                                        size={30}
                                        onClick={() => handleOpenEdit(s)}
                                        aria-label={t('editBrowser')}
                                    >
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                </Tooltip>

                                <Tooltip label={t('delete')} withArrow>
                                    <ActionIcon
                                        size={30}
                                        color="red"
                                        variant="light"
                                        onClick={() => handleDelete(s.id)}
                                        loading={deleteMutation.isPending}
                                        disabled={deleteMutation.isPending}
                                        aria-label={t('delete')}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </>
                        )}
                    </Group>
                )}
            />

            {/* Create modal */}
            <Modal opened={createOpened} onClose={closeCreate} title={t('addBrowser')} size="lg">
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
                            onChange={(e) => setCreateForm({ ...createForm, endpoint: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('p256dh')}
                            placeholder="p256dh..."
                            required
                            value={createForm.p256dh}
                            error={createFieldErrors.p256dh}
                            onChange={(e) => setCreateForm({ ...createForm, p256dh: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('authKey')}
                            placeholder="auth..."
                            required
                            value={createForm.auth}
                            error={createFieldErrors.auth}
                            onChange={(e) => setCreateForm({ ...createForm, auth: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('device')}
                            placeholder="User-Agent..."
                            required
                            value={createForm.userAgent}
                            error={createFieldErrors.userAgent}
                            onChange={(e) => setCreateForm({ ...createForm, userAgent: e.currentTarget.value })}
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

            {/* Edit modal */}
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
                        onChange={(e) => setEditForm({ ...editForm, userAgent: e.currentTarget.value })}
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
                        {t('saveChanges')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
