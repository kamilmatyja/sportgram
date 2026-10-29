import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import { Text, Button, Badge, Modal, Stack, Alert, SimpleGrid, TextInput, Center, Loader, ActionIcon, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import {
    userService,
    pushSubscriptionService,
    type PushSubscriptionResource,
    type GetPushSubscriptionsQuery,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
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
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [endpointFilter, setEndpointFilter] = useState('');
    const [p256dhFilter, setP256dhFilter] = useState('');
    const [authFilter, setAuthFilter] = useState('');

    const [opened, { open, close }] = useDisclosure(false);
    const [subscribing, setSubscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'endpoint:asc', label: t('sort_endpoint_asc') },
        { value: 'endpoint:desc', label: t('sort_endpoint_desc') },
    ];

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

    const queryFilter = useMemo(() => {
        return {
            endpoint: endpointFilter.trim() || null,
            p256dh: p256dhFilter.trim() || null,
            auth: authFilter.trim() || null,
        };
    }, [endpointFilter, p256dhFilter, authFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['push-subscriptions', currentUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!currentUser?.id) return null;
            return pushSubscriptionService.getSubscriptions({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetPushSubscriptionsQuery>['sort']) ?? 'createdAt:desc',
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
                throw new Error(t('missingVapidKey'));
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
            setError(getErrorMessage(err));
        } finally {
            setSubscribing(false);
        }
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => pushSubscriptionService.deleteSubscription(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['push-subscriptions'] });
            notifications.show({ title: t('pushSubscriptions'), message: t('pushSubscriptionDeleted'), color: 'green' });
        },
    });

    const columns: Column<PushSubscriptionResource>[] = [
        {
            key: 'device',
            header: t('browserDevice'),
            render: (s) => (
                <div>
                    <Text size="xs" lineClamp={1}>
                        {s.userAgent || t('unknownDevice')}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                        {s.endpoint}
                    </Text>
                </div>
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

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <TextInput
                label={t('endpoint')}
                placeholder={t('endpoint')}
                value={endpointFilter}
                onChange={(e) => {
                    setEndpointFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('p256dh')}
                placeholder={t('p256dh')}
                value={p256dhFilter}
                onChange={(e) => {
                    setP256dhFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('authKey')}
                placeholder={t('authKey')}
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
                            onClick={() => deleteMutation.mutate(s.id)}
                            loading={deleteMutation.isPending}
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
