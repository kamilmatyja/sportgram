import { useState } from 'react';
import { Group, Text, Button, Badge, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { userService, notificationService, type NotificationResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';

export default function UserNotifications() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['notifications', currentUser?.id, page, limit],
        queryFn: () => {
            if (!currentUser?.id) return null;
            return notificationService.getNotifications({
                page,
                limit,
                sort: 'createdAt:desc',
            });
        },
        enabled: !!currentUser?.id,
    });

    const notifs = data?.data ?? [];
    const pagination = data?.pagination;

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => notificationService.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            notifications.show({ title: t('notifications'), message: t('deleted'), color: 'blue' });
        },
    });

    const columns: Column<NotificationResource>[] = [
        {
            key: 'text',
            header: t('text'),
            render: (n) => (
                <div>
                    <Text size="sm" fw={n.status !== NotificationStatusEnum.READ ? 600 : 400}>
                        {n.text}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </Text>
                </div>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (n) => {
                const isRead = n.status === NotificationStatusEnum.READ;
                return (
                    <Badge size="xs" color={isRead ? 'gray' : 'blue'} variant={isRead ? 'subtle' : 'filled'}>
                        {isRead ? t('notificationStatuses.read') : t('notificationStatuses.sent')}
                    </Badge>
                );
            },
        },
    ];

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} />}
            <DataTable
                columns={columns}
                data={notifs}
                isLoading={isLoading}
                page={page}
                totalItems={pagination?.total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                }}
                actions={(n) => (
                    <Group gap="xs" justify="flex-end">
                        {n.status !== NotificationStatusEnum.READ && (
                            <Button
                                size="xs"
                                variant="subtle"
                                leftSection={<IconCheck size={14} />}
                                onClick={() => markAsReadMutation.mutate(n.id)}
                            >
                                {t('markAsRead')}
                            </Button>
                        )}
                        <Button
                            size="xs"
                            color="red"
                            variant="subtle"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => deleteMutation.mutate(n.id)}
                        >
                            {t('delete')}
                        </Button>
                    </Group>
                )}
            />
        </Stack>
    );
}
