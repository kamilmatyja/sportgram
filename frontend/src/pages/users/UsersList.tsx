import { useState, useMemo } from 'react';
import {
    Avatar,
    Group,
    Text,
    Badge,
    Button,
    SimpleGrid,
    TextInput,
    Select,
    Modal,
    Stack,
    MultiSelect,
    FileInput,
    Textarea,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
import { IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { userService, type UserResource, type GetUsersQuery } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { LanguageEnum } from '../../enums/LanguageEnum';
import { ThemeEnum } from '../../enums/ThemeEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { fileToBase64 } from '../../utils/imageUtils';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { formatImageSrc } from '../../utils/imageUtils';

export default function UsersList() {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const queryClient = useQueryClient();

    const [opened, { open, close }] = useDisclosure(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        link: '',
        phone: '',
        birthAt: '',
        gender: null as string | null,
        country: null as string | null,
        language: '1',
        theme: '1',
        color: '1',
        bio: '',
        roles: ['2'] as string[],
        disciplines: [] as string[],
    });
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [bgPhotoFile, setBgPhotoFile] = useState<File | null>(null);

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!profilePhotoFile || !bgPhotoFile) {
                throw new Error(t('selectPhotoPlaceholder'));
            }
            const profilePhoto = await fileToBase64(profilePhotoFile);
            const backgroundPhoto = await fileToBase64(bgPhotoFile);

            await userService.createUser({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                link: formData.link,
                phone: Number(formData.phone) || 0,
                birthAt: formData.birthAt,
                gender: Number(formData.gender) as 1 | 2,
                country: Number(formData.country) as CountryEnum,
                language: Number(formData.language) as 1 | 2,
                theme: Number(formData.theme) as 1 | 2,
                color: Number(formData.color) as ColorEnum,
                bio: formData.bio,
                profilePhoto,
                backgroundPhoto,
                roles: formData.roles.map(Number) as RoleEnum[],
                disciplines: formData.disciplines.map(Number) as DisciplineEnum[],
            });
        },
        onSuccess: () => {
            close();
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                link: '',
                phone: '',
                birthAt: '',
                gender: null,
                country: null,
                language: '1',
                theme: '1',
                color: '1',
                bio: '',
                roles: ['2'],
                disciplines: [],
            });
            setProfilePhotoFile(null);
            setBgPhotoFile(null);
            setFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['users'] });
            notifications.show({ title: t('users'), message: t('userCreated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });
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

    const canSubmit =
        formData.firstName.trim().length > 0 &&
        formData.lastName.trim().length > 0 &&
        formData.email.trim().length > 0 &&
        formData.password.trim().length > 0 &&
        formData.link.trim().length > 0 &&
        formData.phone.trim().length > 0 &&
        formData.birthAt.trim().length > 0 &&
        formData.gender !== null &&
        formData.country !== null &&
        profilePhotoFile !== null &&
        bgPhotoFile !== null;

    return (
        <>
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
                onAdd={isAdmin ? open : undefined}
                addLabel={t('addUser')}
                actions={(u) => (
                    <Tooltip label={t('details')} withArrow>
                        <ActionIcon
                            component={Link}
                            to={`/users/${u.link}`}
                            variant="light"
                            size={30}
                            aria-label={t('details')}
                        >
                            <IconEye size={16} />
                        </ActionIcon>
                    </Tooltip>
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addUser')} size="lg">
                <Stack gap="sm">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('firstName')}
                            placeholder={t('firstName')}
                            required
                            value={formData.firstName}
                            error={fieldErrors.firstName}
                            onChange={(e) => {
                                const val = e.currentTarget.value;
                                const generatedLink = `${val}-${formData.lastName}`
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                setFormData({ ...formData, firstName: val, link: generatedLink });
                            }}
                        />
                        <TextInput
                            label={t('lastName')}
                            placeholder={t('lastName')}
                            required
                            value={formData.lastName}
                            error={fieldErrors.lastName}
                            onChange={(e) => {
                                const val = e.currentTarget.value;
                                const generatedLink = `${formData.firstName}-${val}`
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                setFormData({ ...formData, lastName: val, link: generatedLink });
                            }}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('email')}
                            placeholder="user@example.com"
                            required
                            type="email"
                            value={formData.email}
                            error={fieldErrors.email}
                            onChange={(e) => setFormData({ ...formData, email: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('password')}
                            placeholder={t('password')}
                            required
                            type="password"
                            value={formData.password}
                            error={fieldErrors.password}
                            onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('link')}
                            placeholder={t('link')}
                            required
                            value={formData.link}
                            error={fieldErrors.link}
                            onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('phone')}
                            placeholder="123456789"
                            required
                            value={formData.phone}
                            error={fieldErrors.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                        <TextInput
                            label={t('birthAt')}
                            type="date"
                            required
                            value={formData.birthAt}
                            error={fieldErrors.birthAt}
                            onChange={(e) => setFormData({ ...formData, birthAt: e.currentTarget.value })}
                        />
                        <Select
                            label={t('gender')}
                            placeholder={t('gender')}
                            required
                            clearable
                            data={GenderEnum.getOptions(t).map((g) => ({ value: String(g.value), label: g.label }))}
                            value={formData.gender}
                            error={fieldErrors.gender}
                            onChange={(val) => setFormData({ ...formData, gender: val })}
                        />
                        <Select
                            label={t('country')}
                            placeholder={t('country')}
                            required
                            clearable
                            data={CountryEnum.getOptions(t).map((c) => ({ value: String(c.value), label: c.label }))}
                            value={formData.country}
                            error={fieldErrors.country}
                            onChange={(val) => setFormData({ ...formData, country: val })}
                            searchable
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                        <Select
                            label={t('language')}
                            placeholder={t('language')}
                            required
                            data={LanguageEnum.getOptions(t).map((l) => ({ value: String(l.value), label: l.label }))}
                            value={formData.language}
                            error={fieldErrors.language}
                            onChange={(val) => setFormData({ ...formData, language: val || '1' })}
                        />
                        <Select
                            label={t('theme')}
                            placeholder={t('theme')}
                            required
                            data={ThemeEnum.getOptions(t).map((th) => ({ value: String(th.value), label: th.label }))}
                            value={formData.theme}
                            error={fieldErrors.theme}
                            onChange={(val) => setFormData({ ...formData, theme: val || '1' })}
                        />
                        <Select
                            label={t('color')}
                            placeholder={t('color')}
                            required
                            data={ColorEnum.getOptions(t).map((cl) => ({ value: String(cl.value), label: cl.label }))}
                            value={formData.color}
                            error={fieldErrors.color}
                            onChange={(val) => setFormData({ ...formData, color: val || '1' })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <MultiSelect
                            label={t('role')}
                            placeholder={t('role')}
                            required
                            clearable
                            data={RoleEnum.getOptions(t).map((r) => ({ value: String(r.value), label: r.label }))}
                            value={formData.roles}
                            error={fieldErrors.roles}
                            onChange={(val) => setFormData({ ...formData, roles: val })}
                        />
                        <MultiSelect
                            label={t('discipline')}
                            placeholder={t('discipline')}
                            clearable
                            data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                            value={formData.disciplines}
                            error={fieldErrors.disciplines}
                            onChange={(val) => setFormData({ ...formData, disciplines: val })}
                        />
                    </SimpleGrid>

                    <Textarea
                        label={t('bio')}
                        placeholder={t('bio')}
                        value={formData.bio}
                        error={fieldErrors.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.currentTarget.value })}
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <FileInput
                            label={t('profilePhoto')}
                            placeholder={t('selectPhotoPlaceholder')}
                            accept="image/*"
                            leftSection={<IconPhoto size={16} />}
                            value={profilePhotoFile}
                            error={fieldErrors.profilePhoto}
                            onChange={setProfilePhotoFile}
                            clearable
                            required
                        />
                        <FileInput
                            label={t('backgroundPhoto')}
                            placeholder={t('selectPhotoPlaceholder')}
                            accept="image/*"
                            leftSection={<IconPhoto size={16} />}
                            value={bgPhotoFile}
                            error={fieldErrors.backgroundPhoto}
                            onChange={setBgPhotoFile}
                            clearable
                            required
                        />
                    </SimpleGrid>

                    <Button
                        mt="md"
                        loading={createMutation.isPending}
                        disabled={!canSubmit}
                        onClick={() => createMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>
        </>
    );
}
