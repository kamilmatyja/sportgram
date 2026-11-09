import { Avatar, Group, Text } from '@mantine/core';
import type { PageResource } from '../../api/services';
import type { Column } from '../DataTable';
import { StatusBadge } from '../common';
import { formatDateTime, formatImageSrc } from '../../utils';

export function getPageTableColumns(t: (key: string) => string): Column<PageResource>[] {
    return [
        {
            key: 'page',
            header: t('title'),
            render: (p) => (
                <Group wrap="nowrap">
                    <Avatar src={formatImageSrc(p.profilePhoto)}>?</Avatar>
                    <div>
                        <Text size="sm" fw={600} lineClamp={1}>
                            {p.title}
                        </Text>
                        <Text size="sm" c="dimmed" lineClamp={1}>
                            @{p.link}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (p) => <StatusBadge status={p.status} />,
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (p) => (
                <Text size="sm" c="dimmed">
                    {formatDateTime(p.createdAt)}
                </Text>
            ),
        },
    ];
}
