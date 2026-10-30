import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
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
    Center,
    Loader,
    Tooltip,
    Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconTrash, IconPlus, IconEdit, IconAdjustments } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { userService, eventService, pageService, type EventResource, type GetEventsQuery } from '../../api/services';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';
import { openConfirmActionModal } from '../../utils/confirmModal';

interface FormEventSubDistance {
    id: string;
    subDistance: string;
}

interface FormEventDistance {
    id: string;
    distance: string;
    subDistances: FormEventSubDistance[];
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

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('startedAt:desc');

    // Filters
    const [titleFilter, setTitleFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Create modal
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Edit modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingEvent, setEditingEvent] = useState<EventResource | null>(null);
    const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        rules: '',
        startedAt: '',
        endedAt: '',
    });
    const [editDisciplines, setEditDisciplines] = useState<FormEventDiscipline[]>([]);
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const {
        isOwner,
        isAdmin,
        canAccessSubpage,
        hasRequiredRole,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser,
        requiredRole: RoleEnum.ORGANIZER,
    });

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

    const editPageId = useMemo(() => {
        if (!editingEvent) return null;
        const p = myPages?.find((page) =>
            page.participants?.some((part) => part.id === editingEvent.pageParticipantId),
        );
        return p?.id ?? null;
    }, [editingEvent, myPages]);

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
        enabled: !!targetUser?.id && canAccessSubpage && hasRequiredRole,
    });

    const events = data?.data ?? [];
    const pagination = data?.pagination;

    // Create disciplines helper functions
    const handleAddDiscipline = () => {
        setDisciplines((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                discipline: null,
                distances: [{ id: crypto.randomUUID(), distance: '', subDistances: [] }],
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
                    distances: [...d.distances, { id: crypto.randomUUID(), distance: '', subDistances: [] }],
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
                            subDistances: [...(dist.subDistances || []), { id: crypto.randomUUID(), subDistance: '' }],
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

    const handleSubDistanceChange = (discId: string, distId: string, subDistId: string, value: string) => {
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
                                sd.id === subDistId ? { ...sd, subDistance: value } : sd,
                            ),
                        };
                    }),
                };
            }),
        );
    };

    // Edit disciplines helper functions
    const handleAddEditDiscipline = () => {
        setEditDisciplines((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                discipline: null,
                distances: [{ id: crypto.randomUUID(), distance: '', subDistances: [] }],
            },
        ]);
    };

    const handleRemoveEditDiscipline = (id: string) => {
        setEditDisciplines((prev) => prev.filter((d) => d.id !== id));
    };

    const handleEditDisciplineChange = (id: string, value: string | null) => {
        setEditDisciplines((prev) => prev.map((d) => (d.id === id ? { ...d, discipline: value } : d)));
    };

    const handleAddEditDistance = (discId: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: [...d.distances, { id: crypto.randomUUID(), distance: '', subDistances: [] }],
                };
            }),
        );
    };

    const handleRemoveEditDistance = (discId: string, distId: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.filter((dist) => dist.id !== distId),
                };
            }),
        );
    };

    const handleEditDistanceChange = (discId: string, distId: string, value: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => (dist.id === distId ? { ...dist, distance: value } : dist)),
                };
            }),
        );
    };

    const handleAddEditSubDistance = (discId: string, distId: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distId) return dist;
                        return {
                            ...dist,
                            subDistances: [...(dist.subDistances || []), { id: crypto.randomUUID(), subDistance: '' }],
                        };
                    }),
                };
            }),
        );
    };

    const handleRemoveEditSubDistance = (discId: string, distId: string, subDistId: string) => {
        setEditDisciplines((prev) =>
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

    const handleEditSubDistanceChange = (discId: string, distId: string, subDistId: string, value: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distId) return dist;
                        return {
                            ...dist,
                            subDistances: (dist.subDistances || []).map((sd) =>
                                sd.id === subDistId ? { ...sd, subDistance: value } : sd,
                            ),
                        };
                    }),
                };
            }),
        );
    };

    const handleOpenEdit = (ev: EventResource) => {
        setEditingEvent(ev);
        setEditPhotoFile(null);
        setEditFormData({
            title: ev.title || '',
            description: ev.description || '',
            link: ev.link || '',
            location: ev.location || '',
            rules: ev.rules || '',
            startedAt: ev.startedAt ? ev.startedAt.slice(0, 16) : '',
            endedAt: ev.endedAt ? ev.endedAt.slice(0, 16) : '',
        });
        setEditDisciplines(
            (ev.disciplines || []).map((d) => ({
                id: d.id || crypto.randomUUID(),
                discipline: d.discipline !== undefined ? String(d.discipline) : null,
                distances: (d.distances || []).map((dist) => ({
                    id: dist.id || crypto.randomUUID(),
                    distance: String(dist.distance ?? ''),
                    subDistances: (dist.subDistances || []).map((sd) => ({
                        id: sd.id || crypto.randomUUID(),
                        subDistance: String(sd.subDistance ?? ''),
                    })),
                })),
            })),
        );
        setEditFieldErrors({});
        openEdit();
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
                        distance: Math.round(Number(dist.distance)) || 0,
                        subDistances: (dist.subDistances || []).map((sd) => ({
                            subDistance: Math.round(Number(sd.subDistance)) || 0,
                        })),
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
            setFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['user-events', targetUser?.id] });
            notifications.show({ title: t('events'), message: t('eventCreated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingEvent) return;
            let photoStr = editingEvent.photo;
            if (editPhotoFile) {
                photoStr = await fileToBase64(editPhotoFile);
            }
            await eventService.updateEvent(editingEvent.id, {
                title: editFormData.title,
                description: editFormData.description,
                link: editFormData.link,
                location: editFormData.location,
                rules: editFormData.rules,
                startedAt: editFormData.startedAt,
                endedAt: editFormData.endedAt,
                photo: photoStr,
                disciplines: editDisciplines.map((d) => ({
                    discipline: Number(d.discipline) as DisciplineEnum,
                    distances: d.distances.map((dist) => ({
                        distance: Math.round(Number(dist.distance)) || 0,
                        subDistances: (dist.subDistances || []).map((sd) => ({
                            subDistance: Math.round(Number(sd.subDistance)) || 0,
                        })),
                    })),
                })),
            });
        },
        onSuccess: () => {
            closeEdit();
            setEditingEvent(null);
            setEditPhotoFile(null);
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['user-events', targetUser?.id] });
            notifications.show({ title: t('events'), message: t('eventUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ElementStatusEnum }) =>
            eventService.updateEventStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-events', targetUser?.id] });
            notifications.show({ title: t('events'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => eventService.deleteEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-events', targetUser?.id] });
            notifications.show({ title: t('events'), message: t('eventDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDelete = (id: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteMutation.mutate(id),
        });
    };

    const columns: Column<EventResource>[] = [
        {
            key: 'title',
            header: t('title'),
            render: (ev) => (
                <Group gap="sm">
                    <Avatar src={formatImageSrc(ev.photo)} radius={5} size="md">
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
        {
            key: 'status',
            header: t('status'),
            render: (ev) => {
                const opt = ElementStatusEnum.getOptions(t).find((o) => o.value === ev.status);
                const color =
                    ev.status === ElementStatusEnum.ACTIVE
                        ? 'green'
                        : ev.status === ElementStatusEnum.REJECTED
                          ? 'red'
                          : 'gray';
                return (
                    <Badge color={color} size="sm">
                        {opt?.label ?? ev.status}
                    </Badge>
                );
            },
        },
    ];

    const canSubmitCreate =
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

    const canSubmitEdit =
        editFormData.title.trim().length > 0 &&
        editFormData.link.trim().length > 0 &&
        editFormData.location.trim().length > 0 &&
        editFormData.startedAt.length > 0 &&
        editFormData.endedAt.length > 0 &&
        editFormData.description.trim().length > 0 &&
        editFormData.rules.trim().length > 0 &&
        editDisciplines.length > 0 &&
        editDisciplines.every(
            (d) =>
                d.discipline !== null &&
                d.distances.length > 0 &&
                d.distances.every((dist) => dist.distance.trim().length > 0),
        );

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            <TextInput
                label={t('title')}
                value={titleFilter}
                onChange={(e) => {
                    setTitleFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('link')}
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

    if (userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
    }

    if (!canAccessSubpage || !hasRequiredRole) {
        return <NotFound title={t('accessDenied')} />;
    }

    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={isOwner} />
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
                onAdd={isOwner ? open : undefined}
                addLabel={t('addEvent')}
                actions={(ev) => (
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('details')} withArrow>
                            <ActionIcon
                                component={Link}
                                to={`/events/${ev.link}`}
                                variant="light"
                                size={30}
                                aria-label={t('details')}
                            >
                                <IconEye size={16} />
                            </ActionIcon>
                        </Tooltip>
                        {canManage && (
                            <>
                                <Menu shadow="md" width={160}>
                                    <Menu.Target>
                                        <Tooltip label={t('changeStatus')} withArrow>
                                            <ActionIcon variant="light" size={30} aria-label={t('changeStatus')}>
                                                <IconAdjustments size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        {ElementStatusEnum.getOptions(t).map((opt) => (
                                            <Menu.Item
                                                key={opt.value}
                                                disabled={ev.status === opt.value || statusMutation.isPending}
                                                onClick={() => statusMutation.mutate({ id: ev.id, status: opt.value })}
                                            >
                                                {opt.label}
                                            </Menu.Item>
                                        ))}
                                    </Menu.Dropdown>
                                </Menu>
                                <Tooltip label={t('editEvent')} withArrow>
                                    <ActionIcon
                                        variant="light"
                                        size={30}
                                        onClick={() => handleOpenEdit(ev)}
                                        aria-label={t('editEvent')}
                                    >
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={t('delete')} withArrow>
                                    <ActionIcon
                                        variant="light"
                                        color="red"
                                        size={30}
                                        onClick={() => handleDelete(ev.id)}
                                        loading={deleteMutation.isPending}
                                        disabled={deleteMutation.isPending}
                                        aria-label={t('delete')}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </>
                        )}
                    </Group>
                )}
            />

            {/* Create modal */}
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
                        required
                        value={formData.title}
                        error={fieldErrors.title}
                        onChange={(e) => {
                            const titleVal = e.currentTarget.value;
                            const linkVal = titleVal
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setFormData({ ...formData, title: titleVal, link: linkVal });
                        }}
                    />

                    <TextInput
                        label={t('link')}
                        required
                        value={formData.link}
                        error={fieldErrors.link}
                        onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                    />

                    <TextInput
                        label={t('location')}
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

                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        required
                        accept="image/*"
                        value={photoFile}
                        error={fieldErrors.photo}
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
                            leftSection={<IconPlus size={16} />}
                            onClick={handleAddDiscipline}
                        >
                            {t('addDiscipline')}
                        </Button>
                    </Group>

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
                                                    required
                                                    flex={1}
                                                    value={dist.distance}
                                                    onChange={(e) =>
                                                        handleDistanceChange(d.id, dist.id, e.currentTarget.value)
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
                                                    <Group key={sd.id} gap="xs" align="flex-end">
                                                        <TextInput
                                                            size="xs"
                                                            label={t('subDistanceMeters')}
                                                            required
                                                            flex={1}
                                                            value={sd.subDistance}
                                                            onChange={(e) =>
                                                                handleSubDistanceChange(
                                                                    d.id,
                                                                    dist.id,
                                                                    sd.id,
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

                    <Textarea
                        label={t('description')}
                        required
                        rows={2}
                        value={formData.description}
                        error={fieldErrors.description}
                        onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                    />

                    <Textarea
                        label={t('rules')}
                        required
                        rows={2}
                        value={formData.rules}
                        error={fieldErrors.rules}
                        onChange={(e) => setFormData({ ...formData, rules: e.currentTarget.value })}
                    />

                    <Button
                        mt="md"
                        loading={createMutation.isPending}
                        disabled={createMutation.isPending || !canSubmitCreate}
                        onClick={() => createMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            {/* Edit modal */}
            <Modal opened={editOpened} onClose={closeEdit} title={t('editEvent')} size="lg">
                <Stack gap="sm">
                    <Select
                        label={t('selectPage')}
                        placeholder={t('selectPage')}
                        disabled
                        data={myPages?.map((p) => ({ value: p.id, label: p.title })) ?? []}
                        value={editPageId}
                    />

                    <TextInput
                        label={t('title')}
                        required
                        value={editFormData.title}
                        error={editFieldErrors.title}
                        onChange={(e) => {
                            const titleVal = e.currentTarget.value;
                            const linkVal = titleVal
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setEditFormData({ ...editFormData, title: titleVal, link: linkVal });
                        }}
                    />

                    <TextInput
                        label={t('link')}
                        required
                        value={editFormData.link}
                        error={editFieldErrors.link}
                        onChange={(e) => setEditFormData({ ...editFormData, link: e.currentTarget.value })}
                    />

                    <TextInput
                        label={t('location')}
                        required
                        value={editFormData.location}
                        error={editFieldErrors.location}
                        onChange={(e) => setEditFormData({ ...editFormData, location: e.currentTarget.value })}
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('startedAt')}
                            type="datetime-local"
                            required
                            value={editFormData.startedAt}
                            error={editFieldErrors.startedAt}
                            onChange={(e) => setEditFormData({ ...editFormData, startedAt: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('endedAt')}
                            type="datetime-local"
                            required
                            value={editFormData.endedAt}
                            error={editFieldErrors.endedAt}
                            onChange={(e) => setEditFormData({ ...editFormData, endedAt: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        description={t('leaveEmptyToKeep')}
                        accept="image/*"
                        value={editPhotoFile}
                        error={editFieldErrors.photo}
                        onChange={setEditPhotoFile}
                        clearable
                    />

                    <Group justify="space-between" align="center" mt="xs">
                        <Text fw={500} size="sm">
                            {t('disciplinesAndDistances')}
                        </Text>
                        <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconPlus size={16} />}
                            onClick={handleAddEditDiscipline}
                        >
                            {t('addDiscipline')}
                        </Button>
                    </Group>

                    <Stack gap="sm">
                        {editDisciplines.map((d) => (
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
                                        onChange={(val) => handleEditDisciplineChange(d.id, val)}
                                        flex={1}
                                    />
                                    <Button
                                        size="xs"
                                        color="red"
                                        variant="subtle"
                                        leftSection={<IconTrash size={16} />}
                                        onClick={() => handleRemoveEditDiscipline(d.id)}
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
                                                    required
                                                    flex={1}
                                                    value={dist.distance}
                                                    onChange={(e) =>
                                                        handleEditDistanceChange(d.id, dist.id, e.currentTarget.value)
                                                    }
                                                />
                                                <ActionIcon
                                                    color="red"
                                                    variant="light"
                                                    size={30}
                                                    onClick={() => handleRemoveEditDistance(d.id, dist.id)}
                                                    title={t('delete')}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>

                                            <Stack gap="xs" mt="xs" pl="sm" className="subdistances-container">
                                                <Group justify="space-between" align="center">
                                                    <Text size="xs" fw={600} c="dimmed">
                                                        {t('subDistances')}
                                                    </Text>
                                                    <Button
                                                        size="compact-xs"
                                                        variant="subtle"
                                                        leftSection={<IconPlus size={16} />}
                                                        onClick={() => handleAddEditSubDistance(d.id, dist.id)}
                                                    >
                                                        {t('addSubDistance')}
                                                    </Button>
                                                </Group>

                                                {dist.subDistances?.map((sd) => (
                                                    <Group key={sd.id} gap="xs" align="flex-end">
                                                        <TextInput
                                                            size="xs"
                                                            label={t('subDistanceMeters')}
                                                            required
                                                            flex={1}
                                                            value={sd.subDistance}
                                                            onChange={(e) =>
                                                                handleEditSubDistanceChange(
                                                                    d.id,
                                                                    dist.id,
                                                                    sd.id,
                                                                    e.currentTarget.value,
                                                                )
                                                            }
                                                        />
                                                        <ActionIcon
                                                            color="red"
                                                            variant="subtle"
                                                            size={30}
                                                            onClick={() =>
                                                                handleRemoveEditSubDistance(d.id, dist.id, sd.id)
                                                            }
                                                            title={t('delete')}
                                                        >
                                                            <IconTrash size={16} />
                                                        </ActionIcon>
                                                    </Group>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    ))}

                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        leftSection={<IconPlus size={16} />}
                                        onClick={() => handleAddEditDistance(d.id)}
                                    >
                                        {t('addDistance')}
                                    </Button>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>

                    <Textarea
                        label={t('description')}
                        required
                        rows={2}
                        value={editFormData.description}
                        error={editFieldErrors.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.currentTarget.value })}
                    />

                    <Textarea
                        label={t('rules')}
                        required
                        rows={2}
                        value={editFormData.rules}
                        error={editFieldErrors.rules}
                        onChange={(e) => setEditFormData({ ...editFormData, rules: e.currentTarget.value })}
                    />

                    <Button
                        mt="md"
                        loading={updateMutation.isPending}
                        disabled={updateMutation.isPending || !canSubmitEdit}
                        onClick={() => updateMutation.mutate()}
                    >
                        {t('saveChanges')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
