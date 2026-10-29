import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import {
    Text,
    Center,
    Loader,
    Button,
    Modal,
    Stack,
    TextInput,
    Textarea,
    Badge,
    Select,
    MultiSelect,
    SimpleGrid,
    ActionIcon,
    Group,
    Paper,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import {
    userService,
    trainingService,
    friendService,
    type TrainingResource,
    type GetTrainingsQuery,
} from '../../api/services';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';

interface FormTrainingSubDistance {
    id: string;
    subDistance: string;
    time: string;
    lat: string;
    lng: string;
    accuracy: string;
    speed: string;
}

interface FormTrainingDistance {
    id: string;
    distance: string;
    time: string;
    subDistances: FormTrainingSubDistance[];
}

interface FormTrainingDiscipline {
    id: string;
    discipline: string | null;
    distances: FormTrainingDistance[];
}

export default function UserTrainings() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isParticipant, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('startedAt:desc');

    // Filters
    const [titleFilter, setTitleFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [opened, { open, close }] = useDisclosure(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        startedAt: '',
        endedAt: '',
    });
    const [disciplines, setDisciplines] = useState<FormTrainingDiscipline[]>([]);

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const { data: myFriendsData } = useQuery({
        queryKey: ['my-accepted-friends', currentUser?.id],
        queryFn: async () => {
            if (!currentUser?.id) return [];
            const res = await friendService.getFriends({
                limit: 100,
                filter: { userIds: [currentUser.id], status: FriendStatusEnum.ACCEPTED },
            });
            const friendsList = res.data ?? [];
            const otherIds = friendsList.map((f) =>
                f.senderUserId === currentUser.id ? f.receiverUserId : f.senderUserId,
            );
            if (otherIds.length === 0) return [];
            return await userService.getUsersByIds(otherIds);
        },
        enabled: !!currentUser?.id,
    });

    const isOwner = currentUser?.id === targetUser?.id;

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

    const { data, isLoading } = useQuery({
        queryKey: ['trainings', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return trainingService.getTrainings({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetTrainingsQuery>['sort']) ?? 'startedAt:desc',
            });
        },
        enabled: !!targetUser?.id,
    });

    const trainings = data?.data ?? [];
    const pagination = data?.pagination;

    const handleAddDiscipline = () => {
        setDisciplines((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                discipline: null,
                distances: [{ id: crypto.randomUUID(), distance: '', time: '', subDistances: [] }],
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
                    distances: [...d.distances, { id: crypto.randomUUID(), distance: '', time: '', subDistances: [] }],
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

    const handleDistanceChange = (discId: string, distId: string, field: 'distance' | 'time', value: string) => {
        setDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => (dist.id === distId ? { ...dist, [field]: value } : dist)),
                };
            }),
        );
    };

    const handleAddSubDistance = (discId: string, distId: string) => {
        setDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distId) return dist;
                        return {
                            ...dist,
                            subDistances: [
                                ...(dist.subDistances || []),
                                {
                                    id: crypto.randomUUID(),
                                    subDistance: '',
                                    time: '',
                                    lat: '',
                                    lng: '',
                                    accuracy: '',
                                    speed: '',
                                },
                            ],
                        };
                    }),
                };
            }),
        );
    };

    const handleRemoveSubDistance = (discId: string, distId: string, subDistId: string) => {
        setDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distId) return dist;
                        return {
                            ...dist,
                            subDistances: (dist.subDistances || []).filter((sd) => sd.id !== subDistId),
                        };
                    }),
                };
            }),
        );
    };

    const handleSubDistanceChange = (
        discId: string,
        distId: string,
        subDistId: string,
        field: keyof FormTrainingSubDistance,
        value: string,
    ) => {
        setDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distId) return dist;
                        return {
                            ...dist,
                            subDistances: (dist.subDistances || []).map((sd) =>
                                sd.id === subDistId ? { ...sd, [field]: value } : sd,
                            ),
                        };
                    }),
                };
            }),
        );
    };

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!currentUser?.id) return;
            if (disciplines.length === 0) throw new Error(t('discipline') + ' ' + t('required'));
            await trainingService.createTraining({
                title: formData.title,
                description: formData.description,
                link: formData.link,
                location: formData.location,
                startedAt: formData.startedAt,
                endedAt: formData.endedAt,
                userIds: Array.from(new Set([currentUser.id, ...collaboratorIds])),
                disciplines: disciplines.map((d) => ({
                    discipline: Number(d.discipline) as DisciplineEnum,
                    distances: d.distances.map((dist) => ({
                        distance: Math.round(Number(dist.distance)) || 0,
                        time: Math.round(Number(dist.time)) || 0,
                        subDistances: (dist.subDistances || []).map((sd) => ({
                            subDistance: Math.round(Number(sd.subDistance)) || 0,
                            time: Math.round(Number(sd.time)) || 0,
                            lat: sd.lat !== '' && !isNaN(Number(sd.lat)) ? Math.round(Number(sd.lat)) : null,
                            lng: sd.lng !== '' && !isNaN(Number(sd.lng)) ? Math.round(Number(sd.lng)) : null,
                            accuracy:
                                sd.accuracy !== '' && !isNaN(Number(sd.accuracy))
                                    ? Math.round(Number(sd.accuracy))
                                    : null,
                            speed: sd.speed !== '' && !isNaN(Number(sd.speed)) ? Math.round(Number(sd.speed)) : null,
                        })),
                    })),
                })),
            });
        },
        onSuccess: () => {
            close();
            setFormData({
                title: '',
                description: '',
                link: '',
                location: '',
                startedAt: '',
                endedAt: '',
            });
            setDisciplines([]);
            setCollaboratorIds([]);
            setFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
            notifications.show({ title: t('trainings'), message: t('trainingAdded'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const columns: Column<TrainingResource>[] = [
        {
            key: 'title',
            header: t('title'),
            render: (tr) => (
                <div>
                    <Text size="sm" fw={600}>
                        {tr.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {tr.location || '-'}
                    </Text>
                </div>
            ),
        },
        {
            key: 'discipline',
            header: t('discipline'),
            render: (tr) => (
                <Group gap={4}>
                    {tr.disciplines?.map((d) => (
                        <Badge key={d.id} size="xs" variant="outline">
                            {DisciplineEnum.getOptions(t).find((o) => o.value === d.discipline)?.label ?? d.discipline}
                        </Badge>
                    ))}
                </Group>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (tr) => {
                const opt = ElementStatusEnum.getOptions(t).find((o) => o.value === tr.status);
                return (
                    <Badge size="xs" variant="light" color={tr.status === ElementStatusEnum.ACTIVE ? 'green' : 'blue'}>
                        {opt?.label ?? tr.status}
                    </Badge>
                );
            },
        },
        {
            key: 'startedAt',
            header: t('startedAt'),
            render: (tr) => (
                <Text size="xs" c="dimmed">
                    {tr.startedAt ? new Date(tr.startedAt).toLocaleString() : '-'}
                </Text>
            ),
        },
        {
            key: 'endedAt',
            header: t('endedAt'),
            render: (tr) => (
                <Text size="xs" c="dimmed">
                    {tr.endedAt ? new Date(tr.endedAt).toLocaleString() : '-'}
                </Text>
            ),
        },
    ];

    const canSubmit =
        formData.title.trim().length > 0 &&
        formData.link.trim().length > 0 &&
        formData.location.trim().length > 0 &&
        formData.startedAt.length > 0 &&
        formData.endedAt.length > 0 &&
        formData.description.trim().length > 0 &&
        disciplines.length > 0 &&
        disciplines.every(
            (d) =>
                d.discipline !== null &&
                d.distances.length > 0 &&
                d.distances.every((dist) => dist.distance.trim().length > 0 && dist.time.trim().length > 0),
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

    if (userLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
    }

    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={isOwner} />
            <DataTable
                columns={columns}
                data={trainings}
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
                onAdd={(isOwner && isParticipant) || isAdmin ? open : undefined}
                addLabel={t('addTraining')}
                actions={(tr) => (
                    <Tooltip label={t('details')} withArrow>
                        <ActionIcon
                            component={Link}
                            to={`/trainings/${tr.link}`}
                            variant="light"
                            color="blue"
                            size={30}
                        >
                            <IconEye size={16} />
                        </ActionIcon>
                    </Tooltip>
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addTraining')} size="lg">
                <Stack gap="sm">
                    <TextInput
                        label={t('title')}
                        placeholder={t('title')}
                        required
                        value={formData.title}
                        error={fieldErrors.title}
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
                        error={fieldErrors.link}
                        onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                    />
                    <TextInput
                        label={t('location')}
                        placeholder={t('location')}
                        required
                        value={formData.location}
                        error={fieldErrors.location}
                        onChange={(e) => setFormData({ ...formData, location: e.currentTarget.value })}
                    />
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('startedAt')}
                            type="datetime-local"
                            required
                            value={formData.startedAt}
                            error={fieldErrors.startedAt}
                            onChange={(e) => setFormData({ ...formData, startedAt: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('endedAt')}
                            type="datetime-local"
                            required
                            value={formData.endedAt}
                            error={fieldErrors.endedAt}
                            onChange={(e) => setFormData({ ...formData, endedAt: e.currentTarget.value })}
                        />
                    </SimpleGrid>
                    <Textarea
                        label={t('description')}
                        placeholder={t('description')}
                        required
                        rows={2}
                        value={formData.description}
                        error={fieldErrors.description}
                        onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                    />

                    <Group justify="space-between" align="center" mt="xs">
                        <Text fw={500} size="sm">
                            {t('disciplinesAndDistances')}
                        </Text>
                        <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconPlus size={16} />}
                            onClick={handleAddDiscipline}
                        >
                            {t('addDiscipline')}
                        </Button>
                    </Group>

                    <MultiSelect
                        label={t('collaborators')}
                        placeholder={t('selectCollaborators')}
                        data={
                            myFriendsData?.map((u) => ({
                                value: u.id,
                                label: `${u.firstName} ${u.lastName} (@${u.link})`,
                            })) ?? []
                        }
                        value={collaboratorIds}
                        onChange={setCollaboratorIds}
                        searchable
                        clearable
                    />

                    <Stack gap="sm">
                        {disciplines.map((d) => (
                            <Paper key={d.id} withBorder p="sm" radius="md">
                                <Group justify="space-between" align="flex-end" mb="xs">
                                    <Select
                                        label={t('discipline')}
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
                                        leftSection={<IconTrash size={16} />}
                                        onClick={() => handleRemoveDiscipline(d.id)}
                                    >
                                        {t('delete')}
                                    </Button>
                                </Group>

                                <Stack gap="sm" mt="xs">
                                    {d.distances.map((dist) => (
                                        <Paper
                                            key={dist.id}
                                            p="xs"
                                            radius="sm"
                                            withBorder
                                            bg="var(--mantine-color-gray-light)"
                                        >
                                            <Group gap="xs" align="flex-end">
                                                <TextInput
                                                    label={t('distanceMeters')}
                                                    placeholder="5000"
                                                    required
                                                    flex={1}
                                                    value={dist.distance}
                                                    onChange={(e) =>
                                                        handleDistanceChange(
                                                            d.id,
                                                            dist.id,
                                                            'distance',
                                                            e.currentTarget.value,
                                                        )
                                                    }
                                                />
                                                <TextInput
                                                    label={t('timeSeconds')}
                                                    placeholder="1800"
                                                    required
                                                    flex={1}
                                                    value={dist.time}
                                                    onChange={(e) =>
                                                        handleDistanceChange(
                                                            d.id,
                                                            dist.id,
                                                            'time',
                                                            e.currentTarget.value,
                                                        )
                                                    }
                                                />
                                                <ActionIcon
                                                    color="red"
                                                    variant="light"
                                                    size={30}
                                                    onClick={() => handleRemoveDistance(d.id, dist.id)}
                                                    title={t('delete')}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>

                                            {/* Sub-distances section */}
                                            <Stack gap="xs" mt="xs" pl="sm" className="subdistances-container">
                                                <Group justify="space-between" align="center">
                                                    <Text size="xs" fw={600} c="dimmed">
                                                        {t('subDistances')}
                                                    </Text>
                                                    <Button
                                                        size="compact-xs"
                                                        variant="subtle"
                                                        leftSection={<IconPlus size={16} />}
                                                        onClick={() => handleAddSubDistance(d.id, dist.id)}
                                                    >
                                                        {t('addSubDistance')}
                                                    </Button>
                                                </Group>

                                                {dist.subDistances?.map((sd) => (
                                                    <Paper key={sd.id} p="xs" radius="xs" withBorder>
                                                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mb="xs">
                                                            <TextInput
                                                                size="xs"
                                                                label={t('subDistanceMeters')}
                                                                placeholder="1000"
                                                                required
                                                                value={sd.subDistance}
                                                                onChange={(e) =>
                                                                    handleSubDistanceChange(
                                                                        d.id,
                                                                        dist.id,
                                                                        sd.id,
                                                                        'subDistance',
                                                                        e.currentTarget.value,
                                                                    )
                                                                }
                                                            />
                                                            <TextInput
                                                                size="xs"
                                                                label={t('timeSeconds')}
                                                                placeholder="300"
                                                                required
                                                                value={sd.time}
                                                                onChange={(e) =>
                                                                    handleSubDistanceChange(
                                                                        d.id,
                                                                        dist.id,
                                                                        sd.id,
                                                                        'time',
                                                                        e.currentTarget.value,
                                                                    )
                                                                }
                                                            />
                                                        </SimpleGrid>

                                                        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                                                            <TextInput
                                                                size="xs"
                                                                label={t('lat')}
                                                                placeholder="52"
                                                                value={sd.lat}
                                                                onChange={(e) =>
                                                                    handleSubDistanceChange(
                                                                        d.id,
                                                                        dist.id,
                                                                        sd.id,
                                                                        'lat',
                                                                        e.currentTarget.value,
                                                                    )
                                                                }
                                                            />
                                                            <TextInput
                                                                size="xs"
                                                                label={t('lng')}
                                                                placeholder="21"
                                                                value={sd.lng}
                                                                onChange={(e) =>
                                                                    handleSubDistanceChange(
                                                                        d.id,
                                                                        dist.id,
                                                                        sd.id,
                                                                        'lng',
                                                                        e.currentTarget.value,
                                                                    )
                                                                }
                                                            />
                                                            <TextInput
                                                                size="xs"
                                                                label={t('accuracy')}
                                                                placeholder="5"
                                                                value={sd.accuracy}
                                                                onChange={(e) =>
                                                                    handleSubDistanceChange(
                                                                        d.id,
                                                                        dist.id,
                                                                        sd.id,
                                                                        'accuracy',
                                                                        e.currentTarget.value,
                                                                    )
                                                                }
                                                            />
                                                            <Group align="flex-end" gap="xs">
                                                                <TextInput
                                                                    size="xs"
                                                                    label={t('speed')}
                                                                    placeholder="12"
                                                                    flex={1}
                                                                    value={sd.speed}
                                                                    onChange={(e) =>
                                                                        handleSubDistanceChange(
                                                                            d.id,
                                                                            dist.id,
                                                                            sd.id,
                                                                            'speed',
                                                                            e.currentTarget.value,
                                                                        )
                                                                    }
                                                                />
                                                                <ActionIcon
                                                                    color="red"
                                                                    variant="subtle"
                                                                    size={30}
                                                                    onClick={() =>
                                                                        handleRemoveSubDistance(d.id, dist.id, sd.id)
                                                                    }
                                                                    title={t('delete')}
                                                                >
                                                                    <IconTrash size={16} />
                                                                </ActionIcon>
                                                            </Group>
                                                        </SimpleGrid>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    ))}

                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        leftSection={<IconPlus size={16} />}
                                        onClick={() => handleAddDistance(d.id)}
                                    >
                                        {t('addDistance')}
                                    </Button>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>

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
