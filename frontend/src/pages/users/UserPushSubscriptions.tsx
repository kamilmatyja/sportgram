import { useState, useMemo } from 'react';
import {
    Badge,
    Button,
    SimpleGrid,
    TextInput,
    Modal,
    Stack,
    ActionIcon,
    Tooltip,
    Center,
    Loader,
    Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import {
    pushSubscriptionService,
    userService,
    type PushSubscriptionResource,
    type GetPushSubscriptionsQuery,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { UserProfileNav } from '../../components/UserProfileNav';
import { NotFound } from '../../components/NotFound';
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
    const { t } = useTranslation();
    const { link } = useParams<{ link: string }>();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    const [opened, { open, close }] = useDisclosure(false);
    const [subscribing, setSubscribing] = useState(false);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [endpointFilter, setEndpointFilter] = useState('');
    const [p256dhFilter, setP256dhFilter] = useState('');
    const [authFilter, setAuthFilter] = useState('');

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => (link ? userService.getUserByLink(link) : null),
        enabled: !!link,
    });

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
        enabled: !!targetUser?.id,
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
                status: PushSubscriptionStatusEnum.ACTIVE,
            });

            close();
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

    const deleteMutation = useMutation({
        mutationFn: (id: string) => pushSubscriptionService.deleteSubscription(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
            notifications.show({
                title: t('pushSubscriptions'),
                message: t('pushSubscriptionDeleted'),
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
                            : t('pushSubscriptionStatuses.inactive')
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

    if (userLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
    }

    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={currentUser?.id === targetUser.id} />
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
                onAdd={open}
                addLabel={t('addSubscription')}
                actions={(s) => (
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
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addSubscription')} size="lg">
                <Stack gap="sm">
                    <Text size="sm">{t('pushSubscriptionInfo')}</Text>
                    <Text size="xs" c="dimmed">
                        {t('pushPermissionWillBeAsked')}
                    </Text>

                    <Button
                        mt="md"
                        loading={subscribing}
                        disabled={subscribing}
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
