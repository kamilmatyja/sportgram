import { useState } from 'react';
import { Group, Text, Button, Badge, Stack, ThemeIcon } from '@mantine/core';
import { IconEye, IconCalendarEvent } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { userService, eventService, type EventResource } from '../../api/services';
import { DataTable, type Column } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export default function UserEvents() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['user-events', targetUser?.id, page, limit],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return eventService.getEvents({
                page,
                limit,
                filter: { userId: targetUser.id },
                sort: 'startedAt:desc',
            });
        },
        enabled: !!targetUser?.id,
    });

    const events = data?.data ?? [];
    const pagination = data?.pagination;

    const columns: Column<EventResource>[] = [
        {
            key: 'title',
            header: t('title'),
            render: (ev) => (
                <Group gap="sm">
                    <ThemeIcon variant="light" color="blue" size="md">
                        <IconCalendarEvent size={18} />
                    </ThemeIcon>
                    <div>
                        <Text size="sm" fw={600}>
                            {ev.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {ev.location || '-'}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'disciplines',
            header: t('discipline'),
            render: (ev) => (
                <Group gap={4}>
                    {ev.disciplines?.map((d) => (
                        <Badge key={d.id} size="xs" variant="outline">
                            {DisciplineEnum.getOptions(t).find((o) => o.value === d.discipline)?.label ?? d.discipline}
                        </Badge>
                    ))}
                </Group>
            ),
        },
        {
            key: 'startedAt',
            header: t('startedAt'),
            render: (ev) => <Text size="xs">{ev.startedAt ? new Date(ev.startedAt).toLocaleString() : '-'}</Text>,
        },
    ];

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} />}
            <DataTable
                columns={columns}
                data={events}
                isLoading={isLoading}
                page={page}
                totalItems={pagination?.total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                }}
                actions={(ev) => (
                    <Button
                        component={Link}
                        to={`/events/${ev.link}`}
                        variant="light"
                        size="xs"
                        leftSection={<IconEye size={14} />}
                    >
                        {t('details')}
                    </Button>
                )}
            />
        </Stack>
    );
}
