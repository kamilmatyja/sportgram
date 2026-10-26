import { useState } from 'react';
import { Avatar, Group, Text, Badge, Button } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { userService, type UserResource } from '../../api/services';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { RoleEnum } from '../../enums/RoleEnum';

export default function UsersList() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['users', page, limit, search],
        queryFn: () =>
            userService.getUsers({
                page,
                limit,
                filter: { firstName: search || null, userIds: null },
                include: ['userRoles', 'userDisciplines'],
                sort: 'createdAt:desc',
            }),
    });

    const users = data?.data ?? [];
    const pagination = data?.pagination;

    const getRoleLabel = (roleId: number) => {
        switch (roleId) {
            case RoleEnum.ADMINISTRATOR:
                return t('roles.administrator');
            case RoleEnum.ORGANIZER:
                return t('roles.organizer');
            case RoleEnum.PARTICIPANT:
                return t('roles.participant');
            default:
                return String(roleId);
        }
    };

    const columns: Column<UserResource>[] = [
        {
            key: 'user',
            header: t('user'),
            render: (u) => (
                <Group gap="sm">
                    <Avatar src={u.profilePhoto || undefined} radius="xl" size="sm">
                        {u.firstName?.[0]}
                    </Avatar>
                    <div>
                        <Text size="sm" fw={500}>
                            {u.firstName} {u.lastName}
                        </Text>
                        <Text size="xs" c="dimmed">
                            @{u.link}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'roles',
            header: t('role'),
            render: (u) => (
                <Group gap={4}>
                    {u.roles?.map((r) => (
                        <Badge key={r.id} size="xs" variant="outline">
                            {getRoleLabel(r.role)}
                        </Badge>
                    ))}
                </Group>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (u) => (
                <StatusBadge
                    status={u.status}
                    label={u.status === 2 ? t('userStatuses.accepted') : t('userStatuses.pending')}
                />
            ),
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (u) => (
                <Text size="xs" c="dimmed">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                </Text>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            page={page}
            totalItems={pagination?.total}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
            }}
            search={search}
            onSearchChange={(s) => {
                setSearch(s);
                setPage(1);
            }}
            searchPlaceholder={t('search')}
            actions={(u) => (
                <Button
                    component={Link}
                    to={`/users/${u.link}`}
                    variant="light"
                    size="xs"
                    leftSection={<IconEye size={14} />}
                >
                    {t('profile')}
                </Button>
            )}
        />
    );
}
