import { useState, useMemo } from 'react';
import { Avatar, Group, Text, Badge, Button, SimpleGrid, TextInput, Select } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { userService, type UserResource, type GetUsersQuery } from '../../api/services';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { formatImageSrc } from '../../utils/imageUtils';

export default function UsersList() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Individual filters (no UUID fields in UI)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [link, setLink] = useState('');
    const [gender, setGender] = useState<string | null>(null);
    const [country, setCountry] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'firstName:asc', label: t('sort_firstName_asc') },
        { value: 'firstName:desc', label: t('sort_firstName_desc') },
        { value: 'lastName:asc', label: t('sort_lastName_asc') },
        { value: 'lastName:desc', label: t('sort_lastName_desc') },
        { value: 'gender:asc', label: t('sort_gender_asc') },
        { value: 'gender:desc', label: t('sort_gender_desc') },
        { value: 'country:asc', label: t('sort_country_asc') },
        { value: 'country:desc', label: t('sort_country_desc') },
        { value: 'birthAt:asc', label: t('sort_birthAt_asc') },
        { value: 'birthAt:desc', label: t('sort_birthAt_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
    ];

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (firstName.trim()) count++;
        if (lastName.trim()) count++;
        if (email.trim()) count++;
        if (link.trim()) count++;
        if (gender !== null) count++;
        if (country !== null) count++;
        if (status !== null) count++;
        return count;
    }, [firstName, lastName, email, link, gender, country, status]);

    const handleResetFilters = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setLink('');
        setGender(null);
        setCountry(null);
        setStatus(null);
        setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            firstName: firstName.trim() || null,
            lastName: lastName.trim() || null,
            email: email.trim() || null,
            link: link.trim() || null,
            gender: gender ? (Number(gender) as 1 | 2) : null,
            country: country ? (Number(country) as CountryEnum) : null,
            status: status ? (Number(status) as UserStatusEnum) : null,
            userIds: null,
        };
    }, [firstName, lastName, email, link, gender, country, status]);

    const { data, isLoading } = useQuery({
        queryKey: ['users', page, limit, sort, queryFilter],
        queryFn: () =>
            userService.getUsers({
                page,
                limit,
                filter: queryFilter,
                'include[]': ['userRoles', 'userDisciplines'],
                sort: (sort as NonNullable<GetUsersQuery>['sort']) ?? 'createdAt:desc',
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
                    <Avatar src={formatImageSrc(u.profilePhoto)} radius="xl" size="sm" color="blue">
                        ?
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
            key: 'email',
            header: t('email'),
            render: (u) => <Text size="xs">{u.email}</Text>,
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
                    label={
                        u.status === UserStatusEnum.ACCEPTED
                            ? t('userStatuses.accepted')
                            : u.status === UserStatusEnum.BANNED
                              ? t('userStatuses.banned')
                              : t('userStatuses.pending')
                    }
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

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            <TextInput
                label={t('firstName')}
                placeholder={t('firstName')}
                value={firstName}
                onChange={(e) => {
                    setFirstName(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('lastName')}
                placeholder={t('lastName')}
                value={lastName}
                onChange={(e) => {
                    setLastName(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('email')}
                placeholder={t('email')}
                value={email}
                onChange={(e) => {
                    setEmail(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('link')}
                placeholder={t('link')}
                value={link}
                onChange={(e) => {
                    setLink(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <Select
                label={t('gender')}
                placeholder={t('allGenders')}
                data={GenderEnum.getOptions(t).map((g) => ({ value: String(g.value), label: g.label }))}
                value={gender}
                onChange={(v) => {
                    setGender(v);
                    setPage(1);
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
                    setPage(1);
                }}
                searchable
                clearable
            />
            <Select
                label={t('status')}
                placeholder={t('allStatuses')}
                data={UserStatusEnum.getOptions(t).map((s) => ({ value: String(s.value), label: s.label }))}
                value={status}
                onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                }}
                clearable
            />
        </SimpleGrid>
    );

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
