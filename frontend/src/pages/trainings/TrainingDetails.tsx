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
    MantineThemeProvider,
    Center,
    Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconMapPin, IconClock, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { applyThemeColor } from '../../utils/themeUtils';
import NotFound from '../../components/NotFound';
import { EmptyState } from '../../components/EmptyState';
import { getErrorMessage } from '../../api/client';
import {
    trainingService,
    userService,
    type TrainingParticipantResource,
    type TrainingDisciplineResource,
    type TrainingDisciplineDistanceResource,
    type TrainingDisciplineSubDistanceResource,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { EntityViewCounter } from '../../components/EntityViewCounter';
import UserProfileNav from '../../components/UserProfileNav';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { brown } from '../../theme';
import { formatDateTime } from '../../utils/date';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { EditActionButton, DeleteActionButton, ViewActionButton } from '../../components/common/RowActionButtons';
import { TrainingFormModal } from '../../components/trainings/TrainingFormModal';
import { useUsersMap } from '../../hooks/useUsersMap';
import { useMyFriends } from '../../hooks/useMyFriends';
import { UserInfoCell } from '../../components/common/UserInfoCell';

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
    const { collaboratorOptions } = useMyFriends();

    const updateStatusMutation = useMutation({
        mutationFn: (status: ElementStatusEnum) => {
            if (!training?.id) throw new Error('No training');
            return trainingService.updateTrainingStatus({
                params: { path: { id: training.id } },
                body: { status },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['training', link] });
            notifications.show({ title: t('trainings'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: SaveStatusEnum }) =>
            trainingService.updateTrainingParticipantStatus({
                params: { path: { id: participantId } },
                body: { status },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['training', link] });
            notifications.show({ title: t('participants'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!training?.id) return;
            await trainingService.deleteTraining({
                params: { path: { id: training.id } },
            });
        },
        onSuccess: () => {
            notifications.show({ title: t('trainings'), message: t('trainingDeleted'), color: 'green' });
            navigate(ownerUser?.link ? `/users/${ownerUser.link}/trainings` : (-1 as unknown as string));
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

    const primaryColor = ColorEnum.getMantineColor(ownerUser?.color);

    useEffect(() => {
        if (!primaryColor) return;
        applyThemeColor(primaryColor);
        return () => {
            applyThemeColor('blue');
        };
    }, [primaryColor]);

    if (trainingLoading || userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!training) {
        return <NotFound title={t('trainingNotFound')} />;
    }

    if (!canAccessSubpage) {
        return <NotFound title={t('accessDenied')} />;
    }

    return (
        <MantineThemeProvider theme={{ primaryColor, colors: { brown } }} inherit>
            <Stack gap="lg">
                {ownerUser && <UserProfileNav user={ownerUser} isOwner={isOwner} />}

                <Card withBorder radius="md" p="lg" shadow="xs">
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
                                <EntityViewCounter entityId={training.id} type={EntryTypeEnum.TRAINING} track={true} />
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
                                    onStatusChange={(status) =>
                                        updateStatusMutation.mutate(status as ElementStatusEnum)
                                    }
                                    isPending={updateStatusMutation.isPending}
                                />
                            )}

                            {isOwner && (
                                <>
                                    <EditActionButton onClick={openEdit} tooltip={t('editTraining')} />
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
                        <StatusBadge status={training.status} enumType={ElementStatusEnum} />
                    </Group>

                    {training.description && (
                        <Text size="sm" mb="md" className="pre-wrap">
                            {training.description}
                        </Text>
                    )}

                    <Title order={4} mb="xs">
                        {t('participants')}
                    </Title>
                    {!training.participants || training.participants.length === 0 ? (
                        <EmptyState title={t('noData')} />
                    ) : (
                        <Table.ScrollContainer minWidth={600} mb="lg">
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
                                        <Table.Th>{t('user')}</Table.Th>
                                        <Table.Th>{t('status')}</Table.Th>
                                        <Table.Th w={120} ta="right">
                                            {t('actions')}
                                        </Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {training.participants?.map((p: TrainingParticipantResource) => {
                                        const u = getUser(p.userId);
                                        const isSelf = p.userId === currentUser?.id;
                                        const canManageParticipant = isSelf;
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
                                                        {canManageParticipant && (
                                                            <StatusActionMenu
                                                                status={p.status}
                                                                options={SaveStatusEnum.getOptions(t)}
                                                                onStatusChange={(status) =>
                                                                    updateParticipantStatusMutation.mutate({
                                                                        participantId: p.id,
                                                                        status: status as SaveStatusEnum,
                                                                    })
                                                                }
                                                                isPending={updateParticipantStatusMutation.isPending}
                                                            />
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}

                    <Title order={4} mb="xs">
                        {t('disciplinesAndDistances')}
                    </Title>
                    {!training.disciplines || training.disciplines.length === 0 ? (
                        <EmptyState title={t('noData')} />
                    ) : (
                        <Stack gap="md">
                            {training.disciplines.map((disc: TrainingDisciplineResource) => (
                                <Paper key={disc.id} withBorder p="md" radius="md">
                                    <Badge variant="light" mb="sm">
                                        {DisciplineEnum.getOptions(t).find((o) => o.value === disc.discipline)?.label ??
                                            disc.discipline}
                                    </Badge>

                                    {!disc.distances || disc.distances.length === 0 ? (
                                        <EmptyState title={t('noData')} />
                                    ) : (
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
                                                        <Table.Th>{t('distanceMeters')}</Table.Th>
                                                        <Table.Th>{t('timeSeconds')}</Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {disc.distances.map(
                                                        (dist: TrainingDisciplineDistanceResource, dIdx) => {
                                                            const hasSub =
                                                                dist.subDistances && dist.subDistances.length > 0;
                                                            const isExpanded = expandedDistanceIds.includes(dist.id);
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
                                                                                <ActionIcon
                                                                                    size="xs"
                                                                                    variant="subtle"
                                                                                    onClick={() =>
                                                                                        toggleExpandDistance(dist.id)
                                                                                    }
                                                                                    aria-label={t('details')}
                                                                                >
                                                                                    {isExpanded ? (
                                                                                        <IconChevronDown size={16} />
                                                                                    ) : (
                                                                                        <IconChevronRight size={16} />
                                                                                    )}
                                                                                </ActionIcon>
                                                                            ) : null}
                                                                        </Table.Td>
                                                                        <Table.Td>
                                                                            <Text size="sm">{dist.distance} m</Text>
                                                                        </Table.Td>
                                                                        <Table.Td>
                                                                            <Text size="sm">{dist.time} s</Text>
                                                                        </Table.Td>
                                                                    </Table.Tr>
                                                                    {hasSub && isExpanded && (
                                                                        <Table.Tr className="table-expansion-row">
                                                                            <Table.Td
                                                                                colSpan={3}
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
                                                                                                {t('subDistanceMeters')}
                                                                                            </Table.Th>
                                                                                            <Table.Th>
                                                                                                {t('timeSeconds')}
                                                                                            </Table.Th>
                                                                                            <Table.Th>
                                                                                                {t('lat')}
                                                                                            </Table.Th>
                                                                                            <Table.Th>
                                                                                                {t('lng')}
                                                                                            </Table.Th>
                                                                                            <Table.Th>
                                                                                                {t('accuracy')}
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
                                                                                                sdIdx,
                                                                                            ) => (
                                                                                                <Table.Tr
                                                                                                    key={sd.id}
                                                                                                    className={
                                                                                                        sdIdx % 2 === 0
                                                                                                            ? 'table-row-odd'
                                                                                                            : 'table-row-even'
                                                                                                    }
                                                                                                >
                                                                                                    <Table.Td>
                                                                                                        <Text size="sm">
                                                                                                            {
                                                                                                                sd.subDistance
                                                                                                            }{' '}
                                                                                                            m
                                                                                                        </Text>
                                                                                                    </Table.Td>
                                                                                                    <Table.Td>
                                                                                                        <Text size="sm">
                                                                                                            {sd.time} s
                                                                                                        </Text>
                                                                                                    </Table.Td>
                                                                                                    <Table.Td>
                                                                                                        <Text size="sm">
                                                                                                            {sd.lat ??
                                                                                                                '-'}
                                                                                                        </Text>
                                                                                                    </Table.Td>
                                                                                                    <Table.Td>
                                                                                                        <Text size="sm">
                                                                                                            {sd.lng ??
                                                                                                                '-'}
                                                                                                        </Text>
                                                                                                    </Table.Td>
                                                                                                    <Table.Td>
                                                                                                        <Text size="sm">
                                                                                                            {sd.accuracy ??
                                                                                                                '-'}
                                                                                                        </Text>
                                                                                                    </Table.Td>
                                                                                                    <Table.Td>
                                                                                                        <Text size="sm">
                                                                                                            {sd.speed ??
                                                                                                                '-'}
                                                                                                        </Text>
                                                                                                    </Table.Td>
                                                                                                </Table.Tr>
                                                                                            ),
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
                                        </Table.ScrollContainer>
                                    )}
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
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['training', link] })}
                />
            </Stack>
        </MantineThemeProvider>
    );
}
