import { useState } from 'react';
import { Group, Text, Button, Avatar, Stack } from '@mantine/core';
import { IconEye, IconBuildingStore } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { userService, pageService, type PageResource } from '../../api/services';
import { DataTable, type Column } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';

export default function UserPages() {
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
        queryKey: ['user-pages', targetUser?.id, page, limit],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return pageService.getPages({
                page,
                limit,
                filter: { userId: targetUser.id },
                sort: 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id,
    });

    const pages = data?.data ?? [];
    const pagination = data?.pagination;

    const columns: Column<PageResource>[] = [
        {
            key: 'title',
            header: t('title'),
            render: (p) => (
                <Group gap="sm">
                    <Avatar src={p.profilePhoto || undefined} radius="md" color="blue">
                        <IconBuildingStore size={20} />
                    </Avatar>
                    <div>
                        <Text size="sm" fw={600}>
                            {p.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                            @{p.link}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'description',
            header: t('description'),
            render: (p) => (
                <Text size="xs" lineClamp={2} c="dimmed">
                    {p.description || '-'}
                </Text>
            ),
        },
    ];

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} />}
            <DataTable
                columns={columns}
                data={pages}
                isLoading={isLoading}
                page={page}
                totalItems={pagination?.total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                }}
                actions={(p) => (
                    <Button
                        component={Link}
                        to={`/pages/${p.link}`}
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
