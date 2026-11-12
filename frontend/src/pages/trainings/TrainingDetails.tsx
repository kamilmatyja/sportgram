import React, { useState, useMemo, useEffect } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Table,
    Paper,
    ActionIcon,
    Tooltip,
    MantineThemeProvider,
    Center,
    Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMapPin, IconClock, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
    trainingService,
    userService,
    type TrainingParticipantResource,
    type TrainingDisciplineResource,
    type TrainingDisciplineDistanceResource,
    type TrainingDisciplineSubDistanceResource,
} from '../../api/services';
import { useAuth } from '../../auth';
import { EmptyState } from '../../components';
import { EntityViewCounter } from '../../components';
import NotFound from '../../components/NotFound';
import UserProfileNav from '../../components/UserProfileNav';
import {
    StatusBadge,
    StatusActionMenu,
    EditActionButton,
    DeleteActionButton,
    ViewActionButton,
    UserInfoCell,
    TrainingFormModal,
    TrainingRouteMap,
    type RoutePoint,
} from '../../components';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import type { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { useMyFriends, useUsersMap, useUserSubpageAccess } from '../../hooks';
import { createDynamicTheme } from '../../theme';
import {
    applyThemeColor,
    confirmDelete,
    formatDateTime,
    notifyError,
    notifySuccess,
    coordFromBackendInt,
    formatPace,
    formatSpeed,
    formatDistance,
    formatTime,
    calculatePace,
    calculateSpeed,
    calculateSplitPace,
    calculateSplitSpeed,
} from '../../utils';

export default function TrainingDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

    const [expandedDistanceIds, setExpandedDistanceIds] = useState<string[]>([]);
    const toggleExpandDistance = (id: string) => {
        setExpandedDistanceIds((prev) => (prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]));
    };

    const { data: training, isLoading: trainingLoading } = useQuery({
        queryKey: ['training', link],
        queryFn: async () => {
            if (!link) return null;
            const res = await trainingService.getTrainings({
                params: {
                    query: {
                        filter: { link },
                        limit: 1,
                        'include[]': [
                            'trainingDisciplines',
                            'trainingDisciplineDistances',
                            'trainingDisciplineSubDistances',
                            'trainingParticipants',
                        ],
                    },
                },
            });
            return res.data?.[0] ?? null;
        },
        enabled: !!link,
    });

    const { data: ownerUserData, isLoading: userLoading } = useQuery({
        queryKey: ['user', training?.userId],
        queryFn: async () => {
            if (!training?.userId) return null;
            const res = await userService.getUser({
                params: {
                    path: { id: training.userId },
                    query: { 'include[]': ['userDisciplines', 'userRoles'] },
                },
            });
            return res.data ?? null;
        },
        enabled: !!training?.userId,
    });

    const ownerUser = ownerUserData ?? null;

    const {
        isAdmin,
        canAccessSubpage,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser: ownerUser,
    });

    const isOwner = !!(currentUser?.id && training?.userId && currentUser.id === training.userId);
    const canManage = isOwner || isAdmin;

    const participantUserIds = useMemo(
        () => training?.participants?.map((p) => p.userId) ?? [],
        [training?.participants],
    );

    const { getUser } = useUsersMap(participantUserIds);
    const { collaboratorOptions } = useMyFriends(undefined, editOpened && canManage);

    const updateStatusMutation = useMutation({
        mutationFn: (status: ElementStatusEnum) => {
            if (!training?.id) throw new Error('No training');
            return trainingService.updateTrainingStatus({
                params: { path: { id: training.id } },
                body: { status },
            });
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['training', link] });
            notifySuccess(t('statusUpdated'), t('trainings'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: SaveStatusEnum }) =>
            trainingService.updateTrainingParticipantStatus({
                params: { path: { id: participantId } },
                body: { status },
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['training', link] });
            notifySuccess(t('statusUpdated'), t('participants'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!training?.id) return;
            await trainingService.deleteTraining({ params: { path: { id: training.id } } });
        },
        onSuccess: () => {
            notifySuccess(t('deleted'), t('trainings'));
            if (ownerUser?.link) {
                void navigate(`/users/${ownerUser.link}/trainings`);
            } else {
                void navigate(-1);
            }
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const primaryColor = ColorEnum.getMantineColor(ownerUser?.color);

    useEffect(() => {
        if (!primaryColor) return;
        applyThemeColor(primaryColor);
        return () => {
            applyThemeColor('blue');
        };
    }, [primaryColor]);

    const dynamicTheme = useMemo(() => createDynamicTheme(primaryColor), [primaryColor]);

    if (trainingLoading || userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!training) {
        return <NotFound title={t('notFound')} />;
    }

    if (!canAccessSubpage) {
        return <NotFound title={t('accessDenied')} />;
    }

    return (
        <MantineThemeProvider theme={dynamicTheme} inherit>
            <Stack gap="xl">
                {ownerUser && <UserProfileNav user={ownerUser} isOwner={isOwner} />}

                <Card>
                    <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
                        <div>
                            <Title order={2}>{training.title}</Title>
                            <Group gap="xs" align="center" mt={2}>
                                <Text size="sm" c="dimmed">
                                    @{training.link}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    •
                                </Text>
                                <EntityViewCounter entityId={training.id} type={EntryTypeEnum.TRAINING} />
                            </Group>
                            <Group gap="xs" mt={4}>
                                <IconMapPin size={16} />
                                <Text size="sm" c="dimmed">
                                    {training.location || '-'}
                                </Text>
                            </Group>
                            <Group gap="xs" mt={4}>
                                <IconClock size={16} />
                                <Text size="xs" c="dimmed">
                                    {training.startedAt ? formatDateTime(training.startedAt) : ''} -{' '}
                                    {training.endedAt ? formatDateTime(training.endedAt) : ''}
                                </Text>
                            </Group>
                        </div>

                        <Group gap="xs" wrap="nowrap">
                            {canManage && (
                                <StatusActionMenu
                                    status={training.status}
                                    onStatusChange={(status) => updateStatusMutation.mutate(status)}
                                    isPending={updateStatusMutation.isPending}
                                />
                            )}

                            {isOwner && (
                                <>
                                    <EditActionButton onClick={openEdit} />
                                    <DeleteActionButton
                                        onClick={() => confirmDelete(t, () => deleteMutation.mutate())}
                                        loading={deleteMutation.isPending}
                                        disabled={deleteMutation.isPending}
                                    />
                                </>
                            )}
                        </Group>
                    </Group>

                    <Group mb="md">
                        <StatusBadge status={training.status} />
                    </Group>

                    {training.description && (
                        <Text size="sm" mb="md" className="pre-wrap">
                            {training.description}
                        </Text>
                    )}

                    <Title order={4} mb="xs">
                        {t('participants')}
                    </Title>
                    <Table.ScrollContainer minWidth={500} mb="lg">
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{t('user')}</Table.Th>
                                    <Table.Th>{t('status')}</Table.Th>
                                    <Table.Th w={120} ta="right">
                                        {t('actions')}
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {!training.participants || training.participants.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={3} className="table-cell-empty">
                                            <EmptyState title={t('noData')} />
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    training.participants?.map((p: TrainingParticipantResource) => {
                                        const u = getUser(p.userId);
                                        const isSelf = p.userId === currentUser?.id;
                                        return (
                                            <Table.Tr key={p.id}>
                                                <Table.Td>
                                                    <UserInfoCell user={u} userId={p.userId} />
                                                </Table.Td>
                                                <Table.Td>
                                                    <StatusBadge status={p.status} enumType={SaveStatusEnum} />
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                                                        {u?.link && <ViewActionButton to={`/users/${u.link}`} />}
                                                        {isSelf && (
                                                            <StatusActionMenu
                                                                status={p.status}
                                                                options={SaveStatusEnum.getOptions(t)}
                                                                onStatusChange={(status) =>
                                                                    updateParticipantStatusMutation.mutate({
                                                                        participantId: p.id,
                                                                        status: status,
                                                                    })
                                                                }
                                                                isPending={updateParticipantStatusMutation.isPending}
                                                            />
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })
                                )}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>

                    <Title order={4} mb="xs">
                        {t('disciplinesAndDistances')}
                    </Title>
                    {!training.disciplines || training.disciplines.length === 0 ? (
                        <EmptyState title={t('noData')} />
                    ) : (
                        <Stack>
                            {training.disciplines.map((disc: TrainingDisciplineResource) => (
                                <Paper key={disc.id}>
                                    <Badge mb="sm">
                                        {DisciplineEnum.getOptions(t).find((o) => o.value === disc.discipline)?.label ??
                                            disc.discipline}
                                    </Badge>

                                    <Table.ScrollContainer minWidth={500}>
                                        <Table>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th w={46} />
                                                    <Table.Th>{t('distance')}</Table.Th>
                                                    <Table.Th>{t('time')}</Table.Th>
                                                    <Table.Th>{t('pace')}</Table.Th>
                                                    <Table.Th>{t('speed')}</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {!disc.distances || disc.distances.length === 0 ? (
                                                    <Table.Tr>
                                                        <Table.Td colSpan={5} className="table-cell-empty">
                                                            <EmptyState title={t('noData')} />
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ) : (
                                                    disc.distances.map(
                                                        (dist: TrainingDisciplineDistanceResource, dIdx: number) => {
                                                            const hasSub =
                                                                dist.subDistances && dist.subDistances.length > 0;
                                                            const isExpanded = expandedDistanceIds.includes(dist.id);
                                                            const distRoutePoints: RoutePoint[] = (
                                                                dist.subDistances ?? []
                                                            ).flatMap((sd) => {
                                                                const lat = coordFromBackendInt(sd.lat);
                                                                const lng = coordFromBackendInt(sd.lng);
                                                                return lat != null && lng != null ? [{ lat, lng }] : [];
                                                            });
                                                            const hasGps = distRoutePoints.length > 0;
                                                            const paceSecPerKm = calculatePace(
                                                                dist.distance,
                                                                dist.time,
                                                            );
                                                            const speedKmH = calculateSpeed(dist.distance, dist.time);

                                                            return (
                                                                <React.Fragment key={dist.id}>
                                                                    <Table.Tr
                                                                        className={
                                                                            dIdx % 2 === 0
                                                                                ? 'table-row-odd'
                                                                                : 'table-row-even'
                                                                        }
                                                                    >
                                                                        <Table.Td>
                                                                            {hasSub ? (
                                                                                <Tooltip label={t('details')}>
                                                                                    <ActionIcon
                                                                                        onClick={() =>
                                                                                            toggleExpandDistance(
                                                                                                dist.id,
                                                                                            )
                                                                                        }
                                                                                        aria-label={t('details')}
                                                                                    >
                                                                                        {isExpanded ? (
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
                                                                                {formatDistance(dist.distance)}
                                                                            </Text>
                                                                        </Table.Td>
                                                                        <Table.Td>
                                                                            <Text size="sm">
                                                                                {formatTime(dist.time)}
                                                                            </Text>
                                                                        </Table.Td>
                                                                        <Table.Td>
                                                                            <Text size="sm">
                                                                                {formatPace(paceSecPerKm)}
                                                                            </Text>
                                                                        </Table.Td>
                                                                        <Table.Td>
                                                                            <Text size="sm">
                                                                                {formatSpeed(speedKmH)}
                                                                            </Text>
                                                                        </Table.Td>
                                                                    </Table.Tr>
                                                                    {hasSub && isExpanded && (
                                                                        <Table.Tr className="table-expansion-row">
                                                                            <Table.Td colSpan={5} p={0}>
                                                                                <Stack gap={0}>
                                                                                    {hasGps && (
                                                                                        <TrainingRouteMap
                                                                                            points={distRoutePoints}
                                                                                            flat
                                                                                        />
                                                                                    )}
                                                                                    <Table>
                                                                                        <Table.Thead>
                                                                                            <Table.Tr>
                                                                                                <Table.Th>
                                                                                                    {t('subDistance')}
                                                                                                </Table.Th>
                                                                                                <Table.Th>
                                                                                                    {t('time')}
                                                                                                </Table.Th>
                                                                                                <Table.Th>
                                                                                                    {t('pace')}
                                                                                                </Table.Th>
                                                                                                <Table.Th>
                                                                                                    {t('speed')}
                                                                                                </Table.Th>
                                                                                            </Table.Tr>
                                                                                        </Table.Thead>
                                                                                        <Table.Tbody>
                                                                                            {dist.subDistances.map(
                                                                                                (
                                                                                                    sd: TrainingDisciplineSubDistanceResource,
                                                                                                    sIdx: number,
                                                                                                ) => {
                                                                                                    let subPaceSecPerKm: number;
                                                                                                    let subSpeedKmH: number;
                                                                                                    if (sIdx === 0) {
                                                                                                        subPaceSecPerKm =
                                                                                                            calculatePace(
                                                                                                                sd.subDistance,
                                                                                                                sd.time,
                                                                                                            );
                                                                                                        subSpeedKmH =
                                                                                                            calculateSpeed(
                                                                                                                sd.subDistance,
                                                                                                                sd.time,
                                                                                                            );
                                                                                                    } else {
                                                                                                        const prevSd =
                                                                                                            dist
                                                                                                                .subDistances[
                                                                                                                sIdx - 1
                                                                                                            ];
                                                                                                        subPaceSecPerKm =
                                                                                                            calculateSplitPace(
                                                                                                                sd.subDistance,
                                                                                                                prevSd.subDistance,
                                                                                                                sd.time,
                                                                                                                prevSd.time,
                                                                                                            );
                                                                                                        subSpeedKmH =
                                                                                                            calculateSplitSpeed(
                                                                                                                sd.subDistance,
                                                                                                                prevSd.subDistance,
                                                                                                                sd.time,
                                                                                                                prevSd.time,
                                                                                                            );
                                                                                                    }

                                                                                                    return (
                                                                                                        <Table.Tr
                                                                                                            key={sd.id}
                                                                                                            className={
                                                                                                                sIdx %
                                                                                                                    2 ===
                                                                                                                0
                                                                                                                    ? 'table-row-odd'
                                                                                                                    : 'table-row-even'
                                                                                                            }
                                                                                                        >
                                                                                                            <Table.Td>
                                                                                                                <Text size="sm">
                                                                                                                    {formatDistance(
                                                                                                                        sd.subDistance,
                                                                                                                    )}
                                                                                                                </Text>
                                                                                                            </Table.Td>
                                                                                                            <Table.Td>
                                                                                                                <Text size="sm">
                                                                                                                    {formatTime(
                                                                                                                        sd.time,
                                                                                                                    )}
                                                                                                                </Text>
                                                                                                            </Table.Td>
                                                                                                            <Table.Td>
                                                                                                                <Text size="sm">
                                                                                                                    {formatPace(
                                                                                                                        subPaceSecPerKm,
                                                                                                                    )}
                                                                                                                </Text>
                                                                                                            </Table.Td>
                                                                                                            <Table.Td>
                                                                                                                <Text size="sm">
                                                                                                                    {formatSpeed(
                                                                                                                        subSpeedKmH,
                                                                                                                    )}
                                                                                                                </Text>
                                                                                                            </Table.Td>
                                                                                                        </Table.Tr>
                                                                                                    );
                                                                                                },
                                                                                            )}
                                                                                        </Table.Tbody>
                                                                                    </Table>
                                                                                </Stack>
                                                                            </Table.Td>
                                                                        </Table.Tr>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        },
                                                    )
                                                )}
                                            </Table.Tbody>
                                        </Table>
                                    </Table.ScrollContainer>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Card>

                <TrainingFormModal
                    opened={editOpened}
                    onClose={closeEdit}
                    training={training}
                    collaboratorOptions={collaboratorOptions}
                    onSuccess={() => void queryClient.invalidateQueries({ queryKey: ['training', link] })}
                />
            </Stack>
        </MantineThemeProvider>
    );
}
