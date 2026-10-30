import { brown } from '../../theme';
import { useState, useMemo, useEffect } from 'react';
import {
    Card,
    Text,
    Button,
    Stack,
    ActionIcon,
    Tooltip,
    MantineThemeProvider,
    Center,
    Loader,
    Group,
    Badge,
    Table,
    Avatar,
    Menu,
    Modal,
    TextInput,
    Textarea,
    Select,
    MultiSelect,
    FileInput,
    SimpleGrid,
    Paper,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import NotFound from '../../components/NotFound';
import { notifications } from '@mantine/notifications';
import { IconBookmark, IconTrash, IconEdit, IconAdjustments, IconPlus, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applyThemeColor } from '../../utils/themeUtils';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import {
    pageService,
    userService,
    eventService,
    type UserResource,
    type PageParticipantResource,
    type EventResource,
    friendService,
} from '../../api/services';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { useAuth } from '../../auth/AuthContext';
import { PageNav } from '../../components/PageNav';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';

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

export default function PageDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser, isAdmin } = useAuth();

    // Edit page modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        link: '',
        color: null as string | null,
    });
    const [editProfilePhotoFile, setEditProfilePhotoFile] = useState<File | null>(null);
    const [editBgPhotoFile, setEditBgPhotoFile] = useState<File | null>(null);
    const [editCollaboratorIds, setEditCollaboratorIds] = useState<string[]>([]);
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

    // Create event modal
    const [createEventOpened, { open: openCreateEvent, close: closeCreateEvent }] = useDisclosure(false);
    const [eventPhotoFile, setEventPhotoFile] = useState<File | null>(null);
    const [eventFormData, setEventFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        rules: '',
        startedAt: '',
        endedAt: '',
    });
    const [eventDisciplines, setEventDisciplines] = useState<FormEventDiscipline[]>([]);
    const [eventFieldErrors, setEventFieldErrors] = useState<Record<string, string>>({});

    const { data: page, isLoading } = useQuery({
        queryKey: ['page', link],
        queryFn: () => pageService.getPageByLink(link || ''),
        enabled: !!link,
    });

    const { data: myFriendsData } = useQuery({
        queryKey: ['my-friends-accepted-page-details', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const res = await friendService.getFriends({
                filter: { userIds: [currentUser.id], status: FriendStatusEnum.ACCEPTED },
                limit: 100,
            });
            const partnerIds = (res.data ?? []).map((f) =>
                f.senderUserId === currentUser.id ? f.receiverUserId : f.senderUserId,
            );
            if (partnerIds.length === 0) return [];
            return await userService.getUsersByIds(partnerIds);
        },
        enabled: !!currentUser,
    });

    const collaboratorOptions = useMemo(() => {
        return (
            myFriendsData?.map((u) => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName} (@${u.link})`,
            })) ?? []
        );
    }, [myFriendsData]);

    const isOwner = currentUser?.id === page?.userId || isAdmin;
    const isParticipant =
        isOwner ||
        (page?.participants?.some((p) => p.userId === currentUser?.id && p.status === ElementStatusEnum.ACTIVE) ??
            false);

    // Check if following
    const { data: followData } = useQuery({
        queryKey: ['page-follows', page?.id, currentUser?.id],
        queryFn: async () => {
            if (!page?.id || !currentUser?.id) return null;
            const res = await pageService.getPageFollows(page.id, currentUser.id);
            return res?.data?.find((f) => f.userId === currentUser.id) ?? null;
        },
        enabled: !!page?.id && !!currentUser?.id,
    });

    // Fetch related events
    const { data: pageEventsData, isLoading: eventsLoading } = useQuery({
        queryKey: ['page-events', page?.id],
        queryFn: async () => {
            if (!page?.id) return [];
            const res = await eventService.getEvents({
                filter: { pageId: page.id },
                limit: 50,
            });
            return res?.data ?? [];
        },
        enabled: !!page?.id,
    });

    const pageEvents = pageEventsData ?? [];

    // Fetch participant user info
    const participantUserIds = useMemo(() => {
        if (!page?.participants) return [];
        return Array.from(new Set(page.participants.map((p) => p.userId)));
    }, [page?.participants]);

    const { data: participantUsersData } = useQuery({
        queryKey: ['page-participant-users', participantUserIds],
        queryFn: async () => {
            if (participantUserIds.length === 0) return {};
            const users = await userService.getUsersByIds(participantUserIds);
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: participantUserIds.length > 0,
    });

    const participantUsers = participantUsersData ?? {};

    const followMutation = useMutation({
        mutationFn: async () => {
            if (!page?.id) return;
            await pageService.followPage(page.id, PageFollowStatusEnum.ACCEPTED);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page-follows'] });
            notifications.show({ title: t('pageFollows'), message: t('pageFollowed'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async (followId: string) => {
            await pageService.unfollowPage(followId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page-follows'] });
            notifications.show({ title: t('pageFollows'), message: t('pageUnfollowed'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEdit = () => {
        if (!page) return;
        setEditFormData({
            title: page.title || '',
            description: page.description || '',
            link: page.link || '',
            color: page.color !== undefined ? String(page.color) : null,
        });
        setEditCollaboratorIds(page.participants?.map((p) => p.userId).filter((id) => id !== page.userId) ?? []);
        setEditProfilePhotoFile(null);
        setEditBgPhotoFile(null);
        setEditFieldErrors({});
        openEdit();
    };

    const updatePageMutation = useMutation({
        mutationFn: async () => {
            if (!page || !editFormData.color) return;
            let profilePhoto = page.profilePhoto;
            let backgroundPhoto = page.backgroundPhoto;
            if (editProfilePhotoFile) {
                profilePhoto = await fileToBase64(editProfilePhotoFile);
            }
            if (editBgPhotoFile) {
                backgroundPhoto = await fileToBase64(editBgPhotoFile);
            }

            await pageService.updatePage(page.id, {
                title: editFormData.title,
                description: editFormData.description,
                link: editFormData.link,
                color: Number(editFormData.color) as ColorEnum,
                profilePhoto,
                backgroundPhoto,
                userIds: editCollaboratorIds,
            });
        },
        onSuccess: () => {
            closeEdit();
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['page', link] });
            notifications.show({ title: t('pages'), message: t('pageUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: (status: ElementStatusEnum) => {
            if (!page?.id) throw new Error('No page');
            return pageService.updatePageStatus(page.id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page', link] });
            notifications.show({ title: t('pages'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!page?.id) return;
            await pageService.deletePage(page.id);
        },
        onSuccess: () => {
            notifications.show({ title: t('pages'), message: t('pageDeleted'), color: 'green' });
            navigate('/pages');
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDelete = () => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteMutation.mutate(),
        });
    };

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: ElementStatusEnum }) =>
            pageService.updatePageParticipantStatus(participantId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page', link] });
            notifications.show({ title: t('participants'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Add event discipline handlers
    const handleAddDiscipline = () => {
        setEventDisciplines((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                discipline: null,
                distances: [{ id: crypto.randomUUID(), distance: '', subDistances: [] }],
            },
        ]);
    };

    const handleRemoveDiscipline = (id: string) => {
        setEventDisciplines((prev) => prev.filter((d) => d.id !== id));
    };

    const handleDisciplineChange = (id: string, value: string | null) => {
        setEventDisciplines((prev) => prev.map((d) => (d.id === id ? { ...d, discipline: value } : d)));
    };

    const handleAddDistance = (discId: string) => {
        setEventDisciplines((prev) =>
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
        setEventDisciplines((prev) =>
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
        setEventDisciplines((prev) =>
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
        setEventDisciplines((prev) =>
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
        setEventDisciplines((prev) =>
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
        setEventDisciplines((prev) =>
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

    const createEventMutation = useMutation({
        mutationFn: async () => {
            if (!page?.id) return;
            if (!eventPhotoFile) throw new Error(t('photo') + ' ' + t('required'));
            if (eventDisciplines.length === 0) throw new Error(t('discipline') + ' ' + t('required'));
            const photoStr = await fileToBase64(eventPhotoFile);

            await eventService.createEvent(page.id, {
                title: eventFormData.title,
                description: eventFormData.description,
                link: eventFormData.link,
                location: eventFormData.location,
                rules: eventFormData.rules,
                startedAt: eventFormData.startedAt,
                endedAt: eventFormData.endedAt,
                photo: photoStr,
                disciplines: eventDisciplines.map((d) => ({
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
            closeCreateEvent();
            setEventPhotoFile(null);
            setEventFormData({
                title: '',
                description: '',
                link: '',
                location: '',
                rules: '',
                startedAt: '',
                endedAt: '',
            });
            setEventDisciplines([]);
            setEventFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['page-events', page?.id] });
            notifications.show({ title: t('events'), message: t('eventCreated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEventFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const primaryColor = ColorEnum.getMantineColor(page?.color);

    useEffect(() => {
        if (!primaryColor) return;
        applyThemeColor(primaryColor);
        return () => {
            applyThemeColor('blue');
        };
    }, [primaryColor]);

    if (isLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!page) {
        return <NotFound title={t('pageNotFound')} />;
    }

    const canSubmitEdit =
        editFormData.title.trim().length > 0 &&
        editFormData.link.trim().length > 0 &&
        editFormData.description.trim().length > 0 &&
        editFormData.color !== null;

    const canSubmitEvent =
        eventFormData.title.trim().length > 0 &&
        eventFormData.link.trim().length > 0 &&
        eventFormData.location.trim().length > 0 &&
        eventFormData.startedAt.length > 0 &&
        eventFormData.endedAt.length > 0 &&
        eventFormData.description.trim().length > 0 &&
        eventFormData.rules.trim().length > 0 &&
        eventPhotoFile !== null &&
        eventDisciplines.length > 0 &&
        eventDisciplines.every(
            (d) =>
                d.discipline !== null &&
                d.distances.length > 0 &&
                d.distances.every((dist) => dist.distance.trim().length > 0),
        );

    const extraActions = (
        <Group gap="xs" wrap="nowrap">
            {followData ? (
                <Button
                    variant="default"
                    size="xs"
                    onClick={() => unfollowMutation.mutate(followData.id)}
                    loading={unfollowMutation.isPending}
                    disabled={unfollowMutation.isPending}
                >
                    {t('unfollowPage')}
                </Button>
            ) : (
                <Button
                    size="xs"
                    leftSection={<IconBookmark size={16} />}
                    onClick={() => followMutation.mutate()}
                    loading={followMutation.isPending}
                    disabled={followMutation.isPending}
                >
                    {t('followPage')}
                </Button>
            )}

            {isOwner && (
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
                                    disabled={page.status === opt.value || statusMutation.isPending}
                                    onClick={() => statusMutation.mutate(opt.value)}
                                >
                                    {opt.label}
                                </Menu.Item>
                            ))}
                        </Menu.Dropdown>
                    </Menu>

                    <Tooltip label={t('editPage')} withArrow>
                        <ActionIcon variant="light" size={30} onClick={handleOpenEdit} aria-label={t('editPage')}>
                            <IconEdit size={16} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label={t('delete')} withArrow>
                        <ActionIcon
                            variant="light"
                            color="red"
                            size={30}
                            onClick={handleDelete}
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
    );

    return (
        <MantineThemeProvider theme={{ primaryColor, colors: { brown } }} inherit>
            <Stack gap="lg">
                <PageNav page={page} extraActions={extraActions} />

                {page.description && (
                    <Card withBorder radius="md" p="md" shadow="xs">
                        <Text size="sm" className="pre-wrap">
                            {page.description}
                        </Text>
                    </Card>
                )}

                {/* Participants table */}
                <Card withBorder radius="md" p="md" shadow="xs">
                    <Title order={4} mb="xs">
                        {t('participants')}
                    </Title>
                    <Table striped withTableBorder withColumnBorders>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('user')}</Table.Th>
                                <Table.Th>{t('status')}</Table.Th>
                                <Table.Th ta="right">{t('actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {page.participants?.map((p: PageParticipantResource) => {
                                const u = participantUsers[p.userId];
                                const isSelf = p.userId === currentUser?.id;
                                const canManageParticipant = isSelf || isOwner;
                                const pOpt = ElementStatusEnum.getOptions(t).find((o) => o.value === p.status);
                                const pColor =
                                    p.status === ElementStatusEnum.ACTIVE
                                        ? 'green'
                                        : p.status === ElementStatusEnum.REJECTED
                                          ? 'red'
                                          : 'gray';

                                return (
                                    <Table.Tr key={p.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar src={formatImageSrc(u?.profilePhoto)} radius={5}>
                                                    ?
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={600}>
                                                        {u ? `${u.firstName} ${u.lastName}` : p.userId}
                                                    </Text>
                                                    {u?.link && (
                                                        <Text size="xs" c="dimmed">
                                                            @{u.link}
                                                        </Text>
                                                    )}
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="xs" color={pColor} variant="light">
                                                {pOpt?.label ?? p.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Group gap="xs" justify="flex-end" wrap="nowrap">
                                                {u?.link && (
                                                    <Tooltip label={t('details')} withArrow>
                                                        <ActionIcon
                                                            component={Link}
                                                            to={`/users/${u.link}`}
                                                            variant="light"
                                                            size={28}
                                                            aria-label={t('details')}
                                                        >
                                                            <IconEye size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                                {canManageParticipant && (
                                                    <Menu shadow="md" width={160}>
                                                        <Menu.Target>
                                                            <Tooltip label={t('changeStatus')} withArrow>
                                                                <ActionIcon
                                                                    variant="light"
                                                                    size={28}
                                                                    aria-label={t('changeStatus')}
                                                                >
                                                                    <IconAdjustments size={14} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Menu.Target>
                                                        <Menu.Dropdown>
                                                            {ElementStatusEnum.getOptions(t).map((opt) => (
                                                                <Menu.Item
                                                                    key={opt.value}
                                                                    disabled={
                                                                        p.status === opt.value ||
                                                                        updateParticipantStatusMutation.isPending
                                                                    }
                                                                    onClick={() =>
                                                                        updateParticipantStatusMutation.mutate({
                                                                            participantId: p.id,
                                                                            status: opt.value as ElementStatusEnum,
                                                                        })
                                                                    }
                                                                >
                                                                    {opt.label}
                                                                </Menu.Item>
                                                            ))}
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                )}
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Card>

                {/* Related Events Table */}
                <Card withBorder radius="md" p="md" shadow="xs">
                    <Group justify="space-between" align="center" mb="xs">
                        <Title order={4}>{t('events')}</Title>
                        {isParticipant && (
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconPlus size={16} />}
                                onClick={openCreateEvent}
                            >
                                {t('addEvent')}
                            </Button>
                        )}
                    </Group>

                    {eventsLoading ? (
                        <Center h={100}>
                            <Loader size="sm" />
                        </Center>
                    ) : pageEvents.length === 0 ? (
                        <Text size="sm" c="dimmed">
                            {t('noData')}
                        </Text>
                    ) : (
                        <Table striped withTableBorder withColumnBorders>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{t('title')}</Table.Th>
                                    <Table.Th>{t('startedAt')}</Table.Th>
                                    <Table.Th>{t('endedAt')}</Table.Th>
                                    <Table.Th>{t('status')}</Table.Th>
                                    <Table.Th ta="right">{t('actions')}</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {pageEvents.map((ev: EventResource) => {
                                    const evOpt = ElementStatusEnum.getOptions(t).find((o) => o.value === ev.status);
                                    const evColor =
                                        ev.status === ElementStatusEnum.ACTIVE
                                            ? 'green'
                                            : ev.status === ElementStatusEnum.REJECTED
                                              ? 'red'
                                              : 'gray';

                                    return (
                                        <Table.Tr key={ev.id}>
                                            <Table.Td>
                                                <Group gap="sm">
                                                    <Avatar src={formatImageSrc(ev.photo)} radius={5} size="sm">
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
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs">
                                                    {ev.startedAt ? new Date(ev.startedAt).toLocaleString() : '-'}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs">
                                                    {ev.endedAt ? new Date(ev.endedAt).toLocaleString() : '-'}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge size="xs" color={evColor} variant="light">
                                                    {evOpt?.label ?? ev.status}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td ta="right">
                                                <Tooltip label={t('details')} withArrow>
                                                    <ActionIcon
                                                        component={Link}
                                                        to={`/events/${ev.link}`}
                                                        variant="light"
                                                        size={28}
                                                        aria-label={t('details')}
                                                    >
                                                        <IconEye size={14} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>

                {/* Edit Page Modal */}
                <Modal opened={editOpened} onClose={closeEdit} title={t('editPage')} size="lg">
                    <Stack gap="sm">
                        <TextInput
                            label={t('title')}
                            required
                            value={editFormData.title}
                            error={editFieldErrors.title}
                            onChange={(e) => {
                                const val = e.currentTarget.value;
                                const generatedLink = val
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                setEditFormData({ ...editFormData, title: val, link: generatedLink });
                            }}
                        />
                        <TextInput
                            label={t('link')}
                            required
                            value={editFormData.link}
                            error={editFieldErrors.link}
                            onChange={(e) => setEditFormData({ ...editFormData, link: e.currentTarget.value })}
                        />
                        <Textarea
                            label={t('description')}
                            rows={3}
                            value={editFormData.description}
                            error={editFieldErrors.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.currentTarget.value })}
                        />
                        <Select
                            label={t('color')}
                            placeholder={t('selectOption')}
                            required
                            clearable
                            data={ColorEnum.getOptions(t).map((opt) => ({
                                value: String(opt.value),
                                label: opt.label,
                            }))}
                            value={editFormData.color}
                            error={editFieldErrors.color}
                            onChange={(val) => setEditFormData({ ...editFormData, color: val })}
                        />
                        <MultiSelect
                            label={t('collaborators')}
                            placeholder={t('selectCollaborators')}
                            data={collaboratorOptions}
                            value={editCollaboratorIds}
                            onChange={setEditCollaboratorIds}
                            searchable
                            clearable
                        />
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <FileInput
                                label={t('profilePhoto')}
                                placeholder={t('selectPhotoPlaceholder')}
                                description={t('leaveEmptyToKeep')}
                                accept="image/*"
                                value={editProfilePhotoFile}
                                error={editFieldErrors.profilePhoto}
                                onChange={setEditProfilePhotoFile}
                                clearable
                            />
                            <FileInput
                                label={t('backgroundPhoto')}
                                placeholder={t('selectPhotoPlaceholder')}
                                description={t('leaveEmptyToKeep')}
                                accept="image/*"
                                value={editBgPhotoFile}
                                error={editFieldErrors.backgroundPhoto}
                                onChange={setEditBgPhotoFile}
                                clearable
                            />
                        </SimpleGrid>
                        <Button
                            mt="md"
                            loading={updatePageMutation.isPending}
                            disabled={updatePageMutation.isPending || !canSubmitEdit}
                            onClick={() => updatePageMutation.mutate()}
                        >
                            {t('saveChanges')}
                        </Button>
                    </Stack>
                </Modal>

                {/* Create Event Modal for this Page */}
                <Modal opened={createEventOpened} onClose={closeCreateEvent} title={t('addEvent')} size="lg">
                    <Stack gap="sm">
                        <TextInput
                            label={t('title')}
                            required
                            value={eventFormData.title}
                            error={eventFieldErrors.title}
                            onChange={(e) => {
                                const titleVal = e.currentTarget.value;
                                const linkVal = titleVal
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                setEventFormData({ ...eventFormData, title: titleVal, link: linkVal });
                            }}
                        />
                        <TextInput
                            label={t('link')}
                            required
                            value={eventFormData.link}
                            error={eventFieldErrors.link}
                            onChange={(e) => setEventFormData({ ...eventFormData, link: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('location')}
                            required
                            value={eventFormData.location}
                            error={eventFieldErrors.location}
                            onChange={(e) => setEventFormData({ ...eventFormData, location: e.currentTarget.value })}
                        />
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <TextInput
                                label={t('startedAt')}
                                type="datetime-local"
                                required
                                value={eventFormData.startedAt}
                                error={eventFieldErrors.startedAt}
                                onChange={(e) =>
                                    setEventFormData({ ...eventFormData, startedAt: e.currentTarget.value })
                                }
                            />
                            <TextInput
                                label={t('endedAt')}
                                type="datetime-local"
                                required
                                value={eventFormData.endedAt}
                                error={eventFieldErrors.endedAt}
                                onChange={(e) => setEventFormData({ ...eventFormData, endedAt: e.currentTarget.value })}
                            />
                        </SimpleGrid>

                        <FileInput
                            label={t('photo')}
                            placeholder={t('selectPhotoPlaceholder')}
                            required
                            accept="image/*"
                            value={eventPhotoFile}
                            error={eventFieldErrors.photo}
                            onChange={setEventPhotoFile}
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
                            {eventDisciplines.map((d) => (
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
                            value={eventFormData.description}
                            error={eventFieldErrors.description}
                            onChange={(e) => setEventFormData({ ...eventFormData, description: e.currentTarget.value })}
                        />

                        <Textarea
                            label={t('rules')}
                            required
                            rows={2}
                            value={eventFormData.rules}
                            error={eventFieldErrors.rules}
                            onChange={(e) => setEventFormData({ ...eventFormData, rules: e.currentTarget.value })}
                        />

                        <Button
                            mt="md"
                            loading={createEventMutation.isPending}
                            disabled={createEventMutation.isPending || !canSubmitEvent}
                            onClick={() => createEventMutation.mutate()}
                        >
                            {t('add')}
                        </Button>
                    </Stack>
                </Modal>
            </Stack>
        </MantineThemeProvider>
    );
}
