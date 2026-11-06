import { brown } from '../../theme';
import React, { useState, useMemo, useEffect } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Button,
    Stack,
    Badge,
    Table,
    Image,
    Paper,
    ActionIcon,
    Tooltip,
    MantineThemeProvider,
    Center,
    Loader,
    Modal,
    TextInput,
    Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import NotFound from '../../components/NotFound';
import { EmptyState } from '../../components/EmptyState';
import { notifications } from '@mantine/notifications';
import { IconMapPin, IconClock, IconCheck, IconPlus, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { applyThemeColor } from '../../utils/themeUtils';
import { getErrorMessage } from '../../api/client';
import {
    eventService,
    pageService,
    type EventDisciplineDistanceResource,
    type EventDisciplineDistanceListResource,
    type EventDisciplineDistanceResultResource,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { EntityViewCounter } from '../../components/EntityViewCounter';
import { PageNav } from '../../components/PageNav';
import { formatDateTime } from '../../utils/date';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { formatImageSrc } from '../../utils/imageUtils';
import { EditActionButton, DeleteActionButton, ViewActionButton } from '../../components/common/RowActionButtons';
import { EventFormModal } from '../../components/events/EventFormModal';
import { useUsersMap } from '../../hooks/useUsersMap';
import { UserInfoCell } from '../../components/common/UserInfoCell';

interface DistanceParticipantsProps {
    distance: EventDisciplineDistanceResource;
    isOwner: boolean;
    isAdmin?: boolean;
    isParticipant: boolean;
    currentUserId?: string;
    onSignUp: (distId: string) => void;
    isSigningUp: boolean;
    primaryColor?: string;
}

function DistanceParticipantsSection({
    distance,
    isOwner,
    isParticipant,
    currentUserId,
    onSignUp,
    isSigningUp,
    primaryColor,
}: DistanceParticipantsProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [expandedParticipantIds, setExpandedParticipantIds] = useState<string[]>([]);
    const toggleExpandParticipant = (id: string) => {
        setExpandedParticipantIds((prev) => (prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]));
    };

    const [expandedResultIds, setExpandedResultIds] = useState<string[]>([]);
    const toggleExpandResult = (id: string) => {
        setExpandedResultIds((prev) => (prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]));
    };

    const [addResultOpened, { open: openAddResult, close: closeAddResult }] = useDisclosure(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [resultTime, setResultTime] = useState('');
    const [subResultsTimes, setSubResultsTimes] = useState<string[]>([]);

    const [editResultOpened, { open: openEditResult, close: closeEditResult }] = useDisclosure(false);
    const [editingResultId, setEditingResultId] = useState<string | null>(null);
    const [editResultTime, setEditResultTime] = useState('');
    const [editSubResultsTimes, setEditSubResultsTimes] = useState<string[]>([]);

    const { data: listData, isLoading } = useQuery({
        queryKey: ['distance-participants', distance.id],
        queryFn: async () => {
            return await eventService.getEventDisciplineDistanceLists({
                params: {
                    query: {
                        filter: {
                            eventDisciplineDistanceId: distance.id,
                        },
                        'include[]': ['eventListResults', 'eventListSubResults'],
                    },
                },
            });
        },
    });

    const participants = listData?.data ?? [];
    const { getUser } = useUsersMap(participants.map((p) => p.userId));

    const isSignedUp = participants.some((p) => p.userId === currentUserId);

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: ElementStatusEnum }) =>
            eventService.updateEventDisciplineDistanceListStatus({
                params: { path: { id: participantId } },
                body: { status: status as 1 | 2 | 3 },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('participants'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const createResultMutation = useMutation({
        mutationFn: async () => {
            if (!selectedParticipantId) return;
            await eventService.createEventDisciplineDistanceResult({
                params: { path: { id: selectedParticipantId } },
                body: {
                    time: Math.round(Number(resultTime)) || 0,
                    subResults: (distance.subDistances || [])
                        .map((sd, idx) => {
                            const val = subResultsTimes[idx];
                            if (!val || !val.trim()) return null;
                            return {
                                eventDisciplineSubDistanceId: sd.id,
                                time: Math.round(Number(val)) || 0,
                            };
                        })
                        .filter((sr): sr is { eventDisciplineSubDistanceId: string; time: number } => sr !== null),
                },
            });
        },
        onSuccess: () => {
            if (selectedParticipantId) {
                setExpandedParticipantIds((prev) =>
                    prev.includes(selectedParticipantId) ? prev : [...prev, selectedParticipantId],
                );
            }
            closeAddResult();
            setSelectedParticipantId(null);
            setResultTime('');
            setSubResultsTimes([]);
            queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('events'), message: t('resultAdded'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateResultMutation = useMutation({
        mutationFn: async () => {
            if (!editingResultId) return;
            await eventService.updateEventDisciplineDistanceResult({
                params: { path: { id: editingResultId } },
                body: {
                    time: Math.round(Number(editResultTime)) || 0,
                    subResults: (distance.subDistances || [])
                        .map((sd, idx) => {
                            const val = editSubResultsTimes[idx];
                            if (!val || !val.trim()) return null;
                            return {
                                eventDisciplineSubDistanceId: sd.id,
                                time: Math.round(Number(val)) || 0,
                            };
                        })
                        .filter((sr): sr is { eventDisciplineSubDistanceId: string; time: number } => sr !== null),
                },
            });
        },
        onSuccess: () => {
            closeEditResult();
            setEditingResultId(null);
            setEditResultTime('');
            setEditSubResultsTimes([]);
            queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('events'), message: t('resultUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteResultMutation = useMutation({
        mutationFn: (resultId: string) =>
            eventService.deleteEventDisciplineDistanceResult({
                params: { path: { id: resultId } },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('events'), message: t('deleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenAddResult = (participantId: string) => {
        setSelectedParticipantId(participantId);
        setResultTime('');
        setSubResultsTimes((distance.subDistances || []).map(() => ''));
        openAddResult();
    };

    const handleOpenEditResult = (res: EventDisciplineDistanceResultResource) => {
        setEditingResultId(res.id);
        setEditResultTime(String(res.time ?? ''));
        setEditSubResultsTimes(res.subResults?.map((sr) => String(sr.time ?? '')) ?? []);
        openEditResult();
    };

    const handleDeleteResult = (resultId: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteResultMutation.mutate(resultId),
        });
    };

    return (
        <Paper p="sm" radius="sm" withBorder mb="sm">
            <Group justify="space-between" mb="xs">
                <Badge color={primaryColor} variant="outline">
                    {distance.distance} m
                </Badge>
                {isParticipant && !isSignedUp && (
                    <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconCheck size={16} />}
                        onClick={() => onSignUp(distance.id)}
                        loading={isSigningUp}
                        disabled={isSigningUp}
                    >
                        {t('saveUp')}
                    </Button>
                )}
            </Group>

            {isLoading ? (
                <Center h={60}>
                    <Loader size="xs" />
                </Center>
            ) : participants.length === 0 ? (
                <EmptyState title={t('noData')} />
            ) : (
                <Stack gap="sm">
                    <Table.ScrollContainer minWidth={600}>
                        <Table
                            striped
                            highlightOnHover
                            withTableBorder
                            withColumnBorders
                            withRowBorders
                            verticalSpacing="sm"
                        >
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th className="table-expand-col" />
                                    <Table.Th>{t('user')}</Table.Th>
                                    <Table.Th>{t('status')}</Table.Th>
                                    <Table.Th w={120} ta="right">
                                        {t('actions')}
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {participants.map((p: EventDisciplineDistanceListResource, pIdx) => {
                                    const u = getUser(p.userId);
                                    const isSelf = p.userId === currentUserId;
                                    const canManageParticipant = isSelf || isOwner;
                                    const hasResults = p.results && p.results.length > 0;
                                    const isParticipantExpanded = expandedParticipantIds.includes(p.id);

                                    return (
                                        <React.Fragment key={p.id}>
                                            <Table.Tr className={pIdx % 2 === 0 ? 'table-row-odd' : 'table-row-even'}>
                                                <Table.Td>
                                                    {hasResults ? (
                                                        <Tooltip label={t('results')} withArrow>
                                                            <ActionIcon
                                                                size="xs"
                                                                variant="subtle"
                                                                onClick={() => toggleExpandParticipant(p.id)}
                                                                aria-label={t('results')}
                                                            >
                                                                {isParticipantExpanded ? (
                                                                    <IconChevronDown size={16} />
                                                                ) : (
                                                                    <IconChevronRight size={16} />
                                                                )}
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    ) : null}
                                                </Table.Td>
                                                <Table.Td>
                                                    <UserInfoCell user={u} userId={p.userId} />
                                                </Table.Td>
                                                <Table.Td>
                                                    <StatusBadge status={p.status} enumType={ElementStatusEnum} />
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                                                        {u?.link && <ViewActionButton to={`/users/${u.link}`} />}
                                                        {canManageParticipant && (
                                                            <StatusActionMenu
                                                                status={p.status}
                                                                onStatusChange={(status) =>
                                                                    updateParticipantStatusMutation.mutate({
                                                                        participantId: p.id,
                                                                        status: status as ElementStatusEnum,
                                                                    })
                                                                }
                                                                isPending={updateParticipantStatusMutation.isPending}
                                                            />
                                                        )}
                                                        {isOwner &&
                                                            p.status === ElementStatusEnum.ACTIVE &&
                                                            (!p.results || p.results.length === 0) && (
                                                                <Button
                                                                    size="xs"
                                                                    variant="subtle"
                                                                    leftSection={<IconPlus size={16} />}
                                                                    onClick={() => handleOpenAddResult(p.id)}
                                                                >
                                                                    {t('addResult')}
                                                                </Button>
                                                            )}
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                            {hasResults && isParticipantExpanded && (
                                                <Table.Tr className="table-expansion-row">
                                                    <Table.Td colSpan={4} p={0} className="table-nested-container">
                                                        <Table
                                                            striped
                                                            highlightOnHover
                                                            withTableBorder
                                                            withColumnBorders
                                                            withRowBorders
                                                            verticalSpacing="sm"
                                                        >
                                                            <Table.Thead>
                                                                <Table.Tr>
                                                                    <Table.Th className="table-expand-col" />
                                                                    <Table.Th>{t('distanceMeters')}</Table.Th>
                                                                    <Table.Th>{t('timeSeconds')}</Table.Th>
                                                                    <Table.Th w={120} ta="right">
                                                                        {t('actions')}
                                                                    </Table.Th>
                                                                </Table.Tr>
                                                            </Table.Thead>
                                                            <Table.Tbody>
                                                                {p.results.map(
                                                                    (
                                                                        res: EventDisciplineDistanceResultResource,
                                                                        rIdx,
                                                                    ) => {
                                                                        const hasSubResults =
                                                                            res.subResults && res.subResults.length > 0;
                                                                        const isSubExpanded =
                                                                            expandedResultIds.includes(res.id);

                                                                        return (
                                                                            <React.Fragment key={res.id}>
                                                                                <Table.Tr
                                                                                    className={
                                                                                        rIdx % 2 === 0
                                                                                            ? 'table-row-odd'
                                                                                            : 'table-row-even'
                                                                                    }
                                                                                >
                                                                                    <Table.Td>
                                                                                        {hasSubResults ? (
                                                                                            <Tooltip
                                                                                                label={t('details')}
                                                                                                withArrow
                                                                                            >
                                                                                                <ActionIcon
                                                                                                    size="xs"
                                                                                                    variant="subtle"
                                                                                                    onClick={() =>
                                                                                                        toggleExpandResult(
                                                                                                            res.id,
                                                                                                        )
                                                                                                    }
                                                                                                    aria-label={t(
                                                                                                        'details',
                                                                                                    )}
                                                                                                >
                                                                                                    {isSubExpanded ? (
                                                                                                        <IconChevronDown
                                                                                                            size={16}
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <IconChevronRight
                                                                                                            size={16}
                                                                                                        />
                                                                                                    )}
                                                                                                </ActionIcon>
                                                                                            </Tooltip>
                                                                                        ) : null}
                                                                                    </Table.Td>
                                                                                    <Table.Td>
                                                                                        <Text size="sm">
                                                                                            {distance.distance} m
                                                                                        </Text>
                                                                                    </Table.Td>
                                                                                    <Table.Td>
                                                                                        <Text size="sm">
                                                                                            {res.time} s
                                                                                        </Text>
                                                                                    </Table.Td>
                                                                                    <Table.Td ta="right">
                                                                                        {isOwner && (
                                                                                            <Group
                                                                                                gap="xs"
                                                                                                justify="flex-end"
                                                                                                wrap="nowrap"
                                                                                            >
                                                                                                <EditActionButton
                                                                                                    onClick={() =>
                                                                                                        handleOpenEditResult(
                                                                                                            res,
                                                                                                        )
                                                                                                    }
                                                                                                    tooltip={t(
                                                                                                        'editResult',
                                                                                                    )}
                                                                                                />
                                                                                                <DeleteActionButton
                                                                                                    onClick={() =>
                                                                                                        handleDeleteResult(
                                                                                                            res.id,
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                            </Group>
                                                                                        )}
                                                                                    </Table.Td>
                                                                                </Table.Tr>
                                                                                {hasSubResults && isSubExpanded && (
                                                                                    <Table.Tr className="table-expansion-row">
                                                                                        <Table.Td
                                                                                            colSpan={4}
                                                                                            p={0}
                                                                                            className="table-nested-container"
                                                                                        >
                                                                                            <Table
                                                                                                striped
                                                                                                highlightOnHover
                                                                                                withTableBorder
                                                                                                withColumnBorders
                                                                                                withRowBorders
                                                                                                verticalSpacing="sm"
                                                                                            >
                                                                                                <Table.Thead>
                                                                                                    <Table.Tr>
                                                                                                        <Table.Th>
                                                                                                            {t(
                                                                                                                'subDistanceMeters',
                                                                                                            )}
                                                                                                        </Table.Th>
                                                                                                        <Table.Th>
                                                                                                            {t(
                                                                                                                'timeSeconds',
                                                                                                            )}
                                                                                                        </Table.Th>
                                                                                                    </Table.Tr>
                                                                                                </Table.Thead>
                                                                                                <Table.Tbody>
                                                                                                    {res.subResults.map(
                                                                                                        (sr, idx) => {
                                                                                                            const sd =
                                                                                                                distance.subDistances?.find(
                                                                                                                    (
                                                                                                                        d,
                                                                                                                    ) =>
                                                                                                                        d.id ===
                                                                                                                        sr.eventDisciplineSubDistanceId,
                                                                                                                );
                                                                                                            return (
                                                                                                                <Table.Tr
                                                                                                                    key={
                                                                                                                        sr.id
                                                                                                                    }
                                                                                                                    className={
                                                                                                                        idx %
                                                                                                                            2 ===
                                                                                                                        0
                                                                                                                            ? 'table-row-odd'
                                                                                                                            : 'table-row-even'
                                                                                                                    }
                                                                                                                >
                                                                                                                    <Table.Td>
                                                                                                                        <Text size="sm">
                                                                                                                            {sd
                                                                                                                                ? `${sd.subDistance} m`
                                                                                                                                : `#${idx + 1}`}
                                                                                                                        </Text>
                                                                                                                    </Table.Td>
                                                                                                                    <Table.Td>
                                                                                                                        <Text size="sm">
                                                                                                                            {
                                                                                                                                sr.time
                                                                                                                            }{' '}
                                                                                                                            s
                                                                                                                        </Text>
                                                                                                                    </Table.Td>
                                                                                                                </Table.Tr>
                                                                                                            );
                                                                                                        },
                                                                                                    )}
                                                                                                </Table.Tbody>
                                                                                            </Table>
                                                                                        </Table.Td>
                                                                                    </Table.Tr>
                                                                                )}
                                                                            </React.Fragment>
                                                                        );
                                                                    },
                                                                )}
                                                            </Table.Tbody>
                                                        </Table>
                                                    </Table.Td>
                                                </Table.Tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                </Stack>
            )}

            <Modal opened={addResultOpened} onClose={closeAddResult} title={t('addResult')} size="lg">
                <Stack gap="sm">
                    <TextInput
                        label={t('timeSeconds')}
                        required
                        type="number"
                        value={resultTime}
                        onChange={(e) => setResultTime(e.currentTarget.value)}
                    />

                    {distance.subDistances && distance.subDistances.length > 0 && (
                        <Stack gap="xs">
                            <Text size="xs" fw={600}>
                                {t('subDistances')}
                            </Text>
                            {distance.subDistances.map((sd, idx) => (
                                <TextInput
                                    key={sd.id}
                                    size="xs"
                                    label={`${sd.subDistance} m (${t('timeSeconds')})`}
                                    type="number"
                                    value={subResultsTimes[idx] ?? ''}
                                    onChange={(e) => {
                                        const newTimes = [...subResultsTimes];
                                        newTimes[idx] = e.currentTarget.value;
                                        setSubResultsTimes(newTimes);
                                    }}
                                />
                            ))}
                        </Stack>
                    )}

                    <Button
                        mt="xs"
                        loading={createResultMutation.isPending}
                        disabled={createResultMutation.isPending || !resultTime.trim()}
                        onClick={() => createResultMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            <Modal opened={editResultOpened} onClose={closeEditResult} title={t('editResult')} size="lg">
                <Stack gap="sm">
                    <TextInput
                        label={t('timeSeconds')}
                        required
                        type="number"
                        value={editResultTime}
                        onChange={(e) => setEditResultTime(e.currentTarget.value)}
                    />

                    {distance.subDistances && distance.subDistances.length > 0 && (
                        <Stack gap="xs">
                            <Text size="xs" fw={600}>
                                {t('subDistances')}
                            </Text>
                            {distance.subDistances.map((sd, idx) => (
                                <TextInput
                                    key={sd.id}
                                    size="xs"
                                    label={`${sd.subDistance} m (${t('timeSeconds')})`}
                                    type="number"
                                    value={editSubResultsTimes[idx] ?? ''}
                                    onChange={(e) => {
                                        const newTimes = [...editSubResultsTimes];
                                        newTimes[idx] = e.currentTarget.value;
                                        setEditSubResultsTimes(newTimes);
                                    }}
                                />
                            ))}
                        </Stack>
                    )}

                    <Button
                        mt="xs"
                        loading={updateResultMutation.isPending}
                        disabled={updateResultMutation.isPending || !editResultTime.trim()}
                        onClick={() => updateResultMutation.mutate()}
                    >
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>
        </Paper>
    );
}

export default function EventDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser, isParticipant, isAdmin } = useAuth();

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

    const { data: event, isLoading: eventLoading } = useQuery({
        queryKey: ['event', link],
        queryFn: async () => {
            if (!link) return null;
            const res = await eventService.getEvents({
                params: {
                    query: {
                        filter: { link },
                        limit: 1,
                        'include[]': ['eventDisciplines', 'eventDisciplineDistances', 'eventDisciplineSubDistances'],
                    },
                },
            });
            return res.data?.[0] ?? null;
        },
        enabled: !!link,
    });

    const { data: pagesData } = useQuery({
        queryKey: ['pages-with-participants'],
        queryFn: () =>
            pageService.getPages({
                params: {
                    query: {
                        limit: 100,
                        'include[]': ['pageParticipants'],
                    },
                },
            }),
        enabled: !!event?.pageParticipantId,
    });

    const page = useMemo(() => {
        if (!event?.pageParticipantId || !pagesData?.data) return null;
        return pagesData.data.find((p) => p.participants?.some((part) => part.id === event.pageParticipantId)) ?? null;
    }, [event?.pageParticipantId, pagesData]);

    const isOwner =
        page?.participants?.some((p) => p.id === event?.pageParticipantId && p.userId === currentUser?.id) ?? false;
    const canManageStatus = isOwner || isAdmin;

    const signUpMutation = useMutation({
        mutationFn: (distanceId: string) =>
            eventService.createEventDisciplineDistanceList({
                params: { path: { id: distanceId } },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distance-participants'] });
            notifications.show({ title: t('events'), message: t('signedUpForStartList'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: (status: ElementStatusEnum) => {
            if (!event?.id) throw new Error('No event');
            return eventService.updateEventStatus({
                params: { path: { id: event.id } },
                body: { status },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', link] });
            notifications.show({ title: t('events'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!event?.id) return;
            await eventService.deleteEvent({
                params: { path: { id: event.id } },
            });
        },
        onSuccess: () => {
            notifications.show({ title: t('events'), message: t('eventDeleted'), color: 'green' });
            navigate('/events');
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

    const primaryColor = ColorEnum.getMantineColor(page?.color);

    useEffect(() => {
        if (!primaryColor) return;
        applyThemeColor(primaryColor);
        return () => {
            applyThemeColor('blue');
        };
    }, [primaryColor]);

    if (eventLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!event) {
        return <NotFound title={t('eventNotFound')} />;
    }

    const eventPhotoSrc = formatImageSrc(event.photo);

    return (
        <MantineThemeProvider theme={{ primaryColor, colors: { brown } }} inherit>
            <Stack gap="lg">
                {page && <PageNav page={page} simplifiedHeader={true} />}

                <Card withBorder radius="md" p="lg" shadow="xs">
                    {eventPhotoSrc && (
                        <Image src={eventPhotoSrc} alt={event.title} radius="md" mah={300} fit="cover" mb="md" />
                    )}

                    <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
                        <div>
                            <Title order={2}>{event.title}</Title>
                            <Group gap="xs" align="center" mt={2}>
                                <Text size="sm" c="dimmed">
                                    @{event.link}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    •
                                </Text>
                                <EntityViewCounter entityId={event.id} type={EntryTypeEnum.EVENT} track={true} />
                            </Group>
                            <Group gap="xs" mt="xs">
                                <IconMapPin size={16} />
                                <Text size="sm" c="dimmed">
                                    {event.location || '-'}
                                </Text>
                            </Group>
                            <Group gap="xs" mt={4}>
                                <IconClock size={16} />
                                <Text size="xs" c="dimmed">
                                    {event.startedAt ? formatDateTime(event.startedAt) : ''} -{' '}
                                    {event.endedAt ? formatDateTime(event.endedAt) : ''}
                                </Text>
                            </Group>
                        </div>

                        <Group gap="xs" wrap="nowrap">
                            {canManageStatus && (
                                <StatusActionMenu
                                    status={event.status}
                                    onStatusChange={(status) => statusMutation.mutate(status)}
                                    isPending={statusMutation.isPending}
                                />
                            )}

                            {isOwner && (
                                <>
                                    <EditActionButton onClick={openEdit} tooltip={t('editEvent')} />
                                    <DeleteActionButton
                                        onClick={handleDelete}
                                        loading={deleteMutation.isPending}
                                        disabled={deleteMutation.isPending}
                                    />
                                </>
                            )}
                        </Group>
                    </Group>

                    <Group gap="sm" mb="md">
                        <StatusBadge status={event.status} enumType={ElementStatusEnum} />
                    </Group>

                    {event.description && (
                        <Text size="sm" mb="md" className="pre-wrap">
                            {event.description}
                        </Text>
                    )}

                    {event.rules && (
                        <Box mb="md">
                            <Text size="xs" fw={700} c="dimmed" mb={4}>
                                {t('rules')}
                            </Text>
                            <Text size="xs" className="pre-wrap">
                                {event.rules}
                            </Text>
                        </Box>
                    )}

                    <Title order={4} mb="sm">
                        {t('disciplinesAndDistances')}
                    </Title>

                    {!event.disciplines || event.disciplines.length === 0 ? (
                        <EmptyState title={t('noData')} />
                    ) : (
                        <Stack gap="md">
                            {event.disciplines.map((disc) => (
                                <Paper key={disc.id} withBorder p="md" radius="md">
                                    <Badge variant="light" mb="sm">
                                        {DisciplineEnum.getOptions(t).find((o) => o.value === disc.discipline)?.label ??
                                            disc.discipline}
                                    </Badge>

                                    <Stack gap="xs">
                                        {disc.distances?.map((dist) => (
                                            <DistanceParticipantsSection
                                                key={dist.id}
                                                distance={dist}
                                                isOwner={isOwner}
                                                isAdmin={isAdmin}
                                                isParticipant={isParticipant}
                                                currentUserId={currentUser?.id}
                                                onSignUp={(dId) => signUpMutation.mutate(dId)}
                                                isSigningUp={signUpMutation.isPending}
                                                primaryColor={primaryColor}
                                            />
                                        ))}
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Card>

                <EventFormModal
                    opened={editOpened}
                    onClose={closeEdit}
                    event={event}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['event', link] })}
                />
            </Stack>
        </MantineThemeProvider>
    );
}
