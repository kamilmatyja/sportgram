import { useState, useMemo } from 'react';
import { Group, Text, TextInput, Select, SimpleGrid } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { userService, type UserResource, type GetUsersQuery } from '../../api/services';
import { useAuth } from '../../auth';
import {
    DataTable,
    type Column,
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserInfoCell,
    UserFormModal,
} from '../../components';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { buildSortOptions, confirmDelete, formatDateTime, notifySuccess, notifyError } from '../../utils';
import { useDataTableState } from '../../hooks';

export default function UsersList() {
    const { t } = useTranslation();
    const { currentUser, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [createOpened, setCreateOpened] = useState(false);
    const [editingUser, setEditingUser] = useState<UserResource | null>(null);

    const tableState = useDataTableState({ initialSort: 'createdAt:desc' });

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [link, setLink] = useState('');
    const [gender, setGender] = useState<string | null>(null);
    const [country, setCountry] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: UserStatusEnum }) =>
            userService.updateUserStatus({
                params: { path: { id } },
                body: { status },
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['users'] });
            notifySuccess(t('statusUpdated'), t('users'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => userService.deleteUser({ params: { path: { id } } }),
        onSuccess: async () => {
            notifySuccess(t('deleted'), t('users'));
            logout();
            navigate('/login');
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const sortOptions = buildSortOptions(t, [
        'createdAt',
        'firstName',
        'lastName',
        'gender',
        'country',
        'birthAt',
        'status',
    ]);

    const activeFiltersCount = useMemo(() => {
        return [firstName.trim(), lastName.trim(), email.trim(), link.trim(), gender, country, status].filter(Boolean)
            .length;
    }, [firstName, lastName, email, link, gender, country, status]);

    const handleResetFilters = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setLink('');
        setGender(null);
        setCountry(null);
        setStatus(null);
        tableState.setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            firstName: firstName.trim() || null,
            lastName: lastName.trim() || null,
            email: email.trim() || null,
            link: link.trim() || null,
            gender: gender ? (Number(gender) as GenderEnum) : null,
            country: country ? (Number(country) as CountryEnum) : null,
            status: status ? (Number(status) as UserStatusEnum) : null,
            userIds: null,
        };
    }, [firstName, lastName, email, link, gender, country, status]);

    const { data, isLoading } = useQuery({
        queryKey: ['users', tableState.page, tableState.limit, tableState.sort, queryFilter],
        queryFn: () =>
            userService.getUsers({
                params: {
                    query: {
                        page: tableState.page,
                        limit: tableState.limit,
                        sort: (tableState.sort as NonNullable<GetUsersQuery>['sort']) ?? 'createdAt:desc',
                        filter: queryFilter,
                        'include[]': ['userDisciplines', 'userRoles'],
                    },
                },
            }),
    });

    const users = data?.data ?? [];
    const pagination = data?.pagination;

    const columns: Column<UserResource>[] = [
        {
            key: 'user',
            header: t('user'),
            render: (u) => <UserInfoCell user={u} />,
        },
        {
            key: 'email',
            header: t('email'),
            render: (u) => (
                <Text size="sm" c="dimmed">
                    {u.email}
                </Text>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (u) => <StatusBadge status={u.status} enumType={UserStatusEnum} />,
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (u) => (
                <Text size="sm" c="dimmed">
                    {formatDateTime(u.createdAt)}
                </Text>
            ),
        },
    ];

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm" w="100%">
            <TextInput
                label={t('firstName')}
                placeholder={t('firstName')}
                value={firstName}
                onChange={(e) => {
                    setFirstName(e.currentTarget.value);
                    tableState.setPage(1);
                }}
            />
            <TextInput
                label={t('lastName')}
                placeholder={t('lastName')}
                value={lastName}
                onChange={(e) => {
                    setLastName(e.currentTarget.value);
                    tableState.setPage(1);
                }}
            />
            <TextInput
                label={t('email')}
                placeholder={t('email')}
                value={email}
                onChange={(e) => {
                    setEmail(e.currentTarget.value);
                    tableState.setPage(1);
                }}
            />
            <TextInput
                label={t('link')}
                placeholder={t('link')}
                value={link}
                onChange={(e) => {
                    setLink(e.currentTarget.value);
                    tableState.setPage(1);
                }}
            />
            <Select
                label={t('gender')}
                placeholder={t('allGenders')}
                data={GenderEnum.getOptions(t).map((g) => ({ value: String(g.value), label: g.label }))}
                value={gender}
                onChange={(v) => {
                    setGender(v);
                    tableState.setPage(1);
                }}
                clearable
            />
            <Select
                label={t('country')}
                placeholder={t('allCountries')}
                data={CountryEnum.getOptions(t).map((c) => ({ value: String(c.value), label: c.label }))}
                value={country}
                onChange={(v) => {
                    setCountry(v);
                    tableState.setPage(1);
                }}
                clearable
                searchable
            />
            <Select
                label={t('status')}
                placeholder={t('allStatuses')}
                data={UserStatusEnum.getOptions(t).map((s) => ({ value: String(s.value), label: s.label }))}
                value={status}
                onChange={(v) => {
                    setStatus(v);
                    tableState.setPage(1);
                }}
                clearable
            />
        </SimpleGrid>
    );

    return (
        <>
            <DataTable
                columns={columns}
                data={users}
                isLoading={isLoading}
                totalItems={pagination?.total}
                state={tableState}
                sortOptions={sortOptions}
                filtersNode={filtersNode}
                activeFiltersCount={activeFiltersCount}
                onResetFilters={handleResetFilters}
                onAdd={isAdmin ? () => setCreateOpened(true) : undefined}
                addLabel={t('addUser')}
                actions={(u) => {
                    const isOwner = currentUser?.id === u.id;
                    return (
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                            <ViewActionButton to={`/users/${u.link}`} />
                            {isAdmin && (
                                <StatusActionMenu
                                    value={u.status}
                                    enumType={UserStatusEnum}
                                    onChange={(st) =>
                                        statusMutation.mutate({
                                            id: u.id,
                                            status: st as UserStatusEnum,
                                        })
                                    }
                                    loading={statusMutation.isPending}
                                />
                            )}
                            {isOwner && (
                                <>
                                    <EditActionButton onClick={() => setEditingUser(u)} />
                                    <DeleteActionButton
                                        onClick={() => confirmDelete(t, () => deleteMutation.mutate(u.id))}
                                        loading={deleteMutation.isPending}
                                    />
                                </>
                            )}
                        </Group>
                    );
                }}
            />

            <UserFormModal opened={createOpened} onClose={() => setCreateOpened(false)} />
            <UserFormModal opened={!!editingUser} user={editingUser} onClose={() => setEditingUser(null)} />
        </>
    );
}
