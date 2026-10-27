import { useState, useMemo } from 'react';
import {
    Group,
    Text,
    Button,
    Badge,
    Stack,
    SimpleGrid,
    TextInput,
    Select,
    ActionIcon,
    Modal,
    FileInput,
    Textarea,
    Avatar,
    Paper,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconTrash, IconPlus } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, eventService, pageService, type EventResource, type GetEventsQuery } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';

interface FormEventDistance {
    id: string;
    distance: string;
}

interface FormEventDiscipline {
    id: string;
    discipline: string | null;
    distances: FormEventDistance[];
}

export default function UserEvents() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isOrganizer, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('startedAt:desc');

    // Filters (no UUID fields in UI)
    const [titleFilter, setTitleFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [opened, { open, close }] = useDisclosure(false);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        rules: '',
        startedAt: '',
        endedAt: '',
    });
    const [disciplines, setDisciplines] = useState<FormEventDiscipline[]>([]);

    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const isOwner = currentUser?.id === targetUser?.id;
    const canManage = isOwner || isAdmin;

    const sortOptions: SortOption[] = [
        { value: 'startedAt:desc', label: t('sort_startedAt_desc') },
        { value: 'startedAt:asc', label: t('sort_startedAt_asc') },
        { value: 'endedAt:desc', label: t('sort_endedAt_desc') },
        { value: 'endedAt:asc', label: t('sort_endedAt_asc') },
        { value: 'title:asc', label: t('sort_title_asc') },
        { value: 'title:desc', label: t('sort_title_desc') },
        { value: 'location:asc', label: t('sort_location_asc') },
        { value: 'location:desc', label: t('sort_location_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
    ];

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (titleFilter.trim()) count++;
        if (linkFilter.trim()) count++;
        if (statusFilter !== null) count++;
        return count;
    }, [titleFilter, linkFilter, statusFilter]);

    const handleResetFilters = () => {
        setTitleFilter('');
        setLinkFilter('');
        setStatusFilter(null);
        setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            userId: targetUser?.id ?? null,
            title: titleFilter.trim() || null,
            link: linkFilter.trim() || null,
            status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
        };
    }, [targetUser?.id, titleFilter, linkFilter, statusFilter]);

    // Fetch organizer pages for creating an event
    const { data: myPages } = useQuery({
        queryKey: ['my-pages', targetUser?.id],
        queryFn: async () => {
            if (!targetUser?.id) return [];
            const res = await pageService.getPages({
                filter: { userId: targetUser.id },
                limit: 50,
            });
            return res?.data ?? [];
        },
        enabled: !!targetUser?.id && canManage,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['user-events', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return eventService.getEvents({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetEventsQuery>['sort']) ?? 'startedAt:desc',
            });
        },
        enabled: !!targetUser?.id,
    });

    const events = data?.data ?? [];
    const pagination = data?.pagination;

    const handleAddDiscipline = () => {
        setDisciplines((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                discipline: null,
                distances: [{ id: crypto.randomUUID(), distance: '' }],
            },
        ]);
    };

    const handleRemoveDiscipline = (id: string) => {
        setDisciplines((prev) => prev.filter((d) => d.id !== id));
    };

    const handleDisciplineChange = (id: string, value: string | null) => {
        setDisciplines((prev) => prev.map((d) => (d.id === id ? { ...d, discipline: value } : d)));
    };

    const handleAddDistance = (discId: string) => {
        setDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: [...d.distances, { id: crypto.randomUUID(), distance: '' }],
                };
            }),
        );
    };

    const handleRemoveDistance = (discId: string, distId: string) => {
        setDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.filter((dist) => dist.id !== distId),
                };
            }),
        );
    };

    const handleDistanceChange = (discId: string, distId: string, value: string) => {
        setDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => (dist.id === distId ? { ...dist, distance: value } : dist)),
                };
            }),
        );
    };

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!selectedPageId) throw new Error(t('selectPage'));
            if (!photoFile) throw new Error(t('photo') + ' ' + t('required'));
            if (disciplines.length === 0) throw new Error(t('discipline') + ' ' + t('required'));
            const photoStr = await fileToBase64(photoFile);

            await eventService.createEvent(selectedPageId, {
                title: formData.title,
                description: formData.description,
                link: formData.link,
                location: formData.location,
                rules: formData.rules,
                startedAt: formData.startedAt,
                endedAt: formData.endedAt,
                photo: photoStr,
                disciplines: disciplines.map((d) => ({
                    discipline: Number(d.discipline) as DisciplineEnum,
                    distances: d.distances.map((dist) => ({
                        distance: Number(dist.distance) || 0,
                        subDistances: [],
                    })),
                })),
            });
        },
        onSuccess: () => {
            close();
            setPhotoFile(null);
            setSelectedPageId(null);
            setFormData({
                title: '',
                description: '',
                link: '',
                location: '',
                rules: '',
                startedAt: '',
                endedAt: '',
            });
            setDisciplines([]);
            queryClient.invalidateQueries({ queryKey: ['user-events', targetUser?.id] });
            notifications.show({ title: t('events'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => eventService.deleteEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-events', targetUser?.id] });
            notifications.show({ title: t('events'), message: t('deleted'), color: 'blue' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const columns: Column<EventResource>[] = [
        {
            key: 'title',
            header: t('title'),
            render: (ev) => (
                <Group gap="sm">
                    <Avatar src={formatImageSrc(ev.photo)} radius="sm" size="md">
                        ?
                    </Avatar>
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
        {
            key: 'endedAt',
            header: t('endedAt'),
            render: (ev) => <Text size="xs">{ev.endedAt ? new Date(ev.endedAt).toLocaleString() : '-'}</Text>,
        },
    ];

    const canSubmit =
        selectedPageId !== null &&
        formData.title.trim().length > 0 &&
        formData.link.trim().length > 0 &&
        formData.location.trim().length > 0 &&
        formData.startedAt.length > 0 &&
        formData.endedAt.length > 0 &&
        formData.description.trim().length > 0 &&
        formData.rules.trim().length > 0 &&
        photoFile !== null &&
        disciplines.length > 0 &&
        disciplines.every(
            (d) =>
                d.discipline !== null &&
                d.distances.length > 0 &&
                d.distances.every((dist) => dist.distance.trim().length > 0),
        );

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            <TextInput
                label={t('title')}
                placeholder={t('title')}
                value={titleFilter}
                onChange={(e) => {
                    setTitleFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('link')}
                placeholder={t('link')}
                value={linkFilter}
                onChange={(e) => {
                    setLinkFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <Select
                label={t('status')}
                placeholder={t('allStatuses')}
                data={ElementStatusEnum.getOptions(t).map((s) => ({ value: String(s.value), label: s.label }))}
                value={statusFilter}
                onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                }}
                clearable
            />
        </SimpleGrid>
    );

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} isOwner={isOwner} />}
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
                onAdd={(isOwner && isOrganizer) || isAdmin ? open : undefined}
                addLabel={t('addEvent')}
                actions={(ev) => (
                    <Group gap="xs" justify="flex-end">
                        <Button
                            component={Link}
                            to={`/events/${ev.link}`}
                            variant="light"
                            size="xs"
                            leftSection={<IconEye size={14} />}
                        >
                            {t('details')}
                        </Button>
                        {canManage && (
                            <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                onClick={() => deleteMutation.mutate(ev.id)}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        )}
                    </Group>
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addEvent')} size="lg">
                <Stack gap="sm">
                    <Select
                        label={t('selectPage')}
                        placeholder={t('selectPage')}
                        required
                        clearable
                        data={myPages?.map((p) => ({ value: p.id, label: p.title })) ?? []}
                        value={selectedPageId}
                        onChange={(val) => setSelectedPageId(val)}
                    />

                    <TextInput
                        label={t('title')}
                        placeholder={t('title')}
                        required
                        value={formData.title}
                        onChange={(e) => {
                            const title = e.currentTarget.value;
                            const link = title
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setFormData({ ...formData, title, link });
                        }}
                    />

                    <TextInput
                        label={t('link')}
                        placeholder={t('link')}
                        required
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                    />

                    <TextInput
                        label={t('location')}
                        placeholder={t('location')}
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.currentTarget.value })}
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('startedAt')}
                            type="datetime-local"
                            required
                            value={formData.startedAt}
                            onChange={(e) => setFormData({ ...formData, startedAt: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('endedAt')}
                            type="datetime-local"
                            required
                            value={formData.endedAt}
                            onChange={(e) => setFormData({ ...formData, endedAt: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        required
                        accept="image/*"
                        value={photoFile}
                        onChange={setPhotoFile}
                        clearable
                    />

                    <Group justify="space-between" align="center" mt="xs">
                        <Text fw={500} size="sm">
                            {t('disciplinesAndDistances')}
                        </Text>
                        <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconPlus size={14} />}
                            onClick={handleAddDiscipline}
                        >
                            {t('addDiscipline')}
                        </Button>
                    </Group>

                    <Stack gap="sm">
                        {disciplines.map((d, dIdx) => (
                            <Paper key={d.id} withBorder p="sm" radius="md">
                                <Group justify="space-between" align="flex-end" mb="xs">
                                    <Select
                                        label={`${t('discipline')} #${dIdx + 1}`}
                                        placeholder={t('discipline')}
                                        required
                                        clearable
                                        data={DisciplineEnum.getOptions(t).map((opt) => ({
                                            value: String(opt.value),
                                            label: opt.label,
                                        }))}
                                        value={d.discipline}
                                        onChange={(val) => handleDisciplineChange(d.id, val)}
                                        flex={1}
                                    />
                                    <Button
                                        size="xs"
                                        color="red"
                                        variant="subtle"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={() => handleRemoveDiscipline(d.id)}
                                    >
                                        {t('delete')}
                                    </Button>
                                </Group>

                                <Stack gap="xs" mt="xs">
                                    {d.distances.map((dist) => (
                                        <Group key={dist.id} gap="xs" align="flex-end">
                                            <TextInput
                                                label={t('distanceMeters')}
                                                placeholder="5000"
                                                required
                                                flex={1}
                                                value={dist.distance}
                                                onChange={(e) =>
                                                    handleDistanceChange(d.id, dist.id, e.currentTarget.value)
                                                }
                                            />
                                            <ActionIcon
                                                color="red"
                                                variant="subtle"
                                                size="lg"
                                                onClick={() => handleRemoveDistance(d.id, dist.id)}
                                                title={t('delete')}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    ))}

                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        leftSection={<IconPlus size={14} />}
                                        onClick={() => handleAddDistance(d.id)}
                                    >
                                        {t('addDistance')}
                                    </Button>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>

                    <Textarea
                        label={t('description')}
                        placeholder={t('description')}
                        required
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                    />

                    <Textarea
                        label={t('rules')}
                        placeholder={t('rules')}
                        required
                        rows={2}
                        value={formData.rules}
                        onChange={(e) => setFormData({ ...formData, rules: e.currentTarget.value })}
                    />

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
        </Stack>
    );
}
