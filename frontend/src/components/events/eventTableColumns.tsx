import { Avatar, Group, Text } from '@mantine/core';
import type { EventResource } from '../../api/services';
import type { Column } from '../DataTable';
import { StatusBadge } from '../common';
import { formatDateTime, formatImageSrc } from '../../utils';

export function getEventTableColumns(t: (key: string) => string): Column<EventResource>[] {
    return [
        {
            key: 'title',
            header: t('title'),
            render: (ev) => (
                <Group wrap="nowrap">
                    <Avatar src={formatImageSrc(ev.photo)}>?</Avatar>
                    <div>
                        <Text size="sm" fw={600} lineClamp={1}>
                            {ev.title}
                        </Text>
                        <Text size="sm" c="dimmed" lineClamp={1}>
                            {ev.location || '-'}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'startedAt',
            header: t('startedAt'),
            render: (ev) => (
                <Text size="sm" c="dimmed">
                    {formatDateTime(ev.startedAt)}
                </Text>
            ),
        },
        {
            key: 'endedAt',
            header: t('endedAt'),
            render: (ev) => (
                <Text size="sm" c="dimmed">
                    {formatDateTime(ev.endedAt)}
                </Text>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (ev) => <StatusBadge status={ev.status} />,
        },
    ];
}
