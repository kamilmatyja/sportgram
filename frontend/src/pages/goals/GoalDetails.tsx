import { useMemo, useEffect } from 'react';
import { Card, Title, Text, Group, Stack, Badge, Table, MantineThemeProvider, Center, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconClock } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
    goalService,
    userService,
    type GoalParticipantResource,
    type GoalParticipantResultResource,
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
} from '../../components';
import { GoalFormModal } from '../../components';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { useUsersMap, useMyFriends, useUserSubpageAccess } from '../../hooks';
import { createDynamicTheme } from '../../theme';
import {
    applyThemeColor,
    confirmDelete,
    formatDateTime,
    formatDistance,
    formatPace,
    formatSpeed,
    formatTime,
    calculatePace,
    calculateSpeed,
    notifyError,
    notifySuccess,
} from '../../utils';

export default function GoalDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

    const { data: goal, isLoading: goalLoading } = useQuery({
        queryKey: ['goal', link],
        queryFn: async () => {
            if (!link) return null;
            const res = await goalService.getGoals({
                params: {
                    query: {
                        filter: { link },
                        limit: 1,
                        'include[]': ['goalParticipants', 'goalParticipantResults'],
                    },
                },
            });
            return res.data?.[0] ?? null;
        },
        enabled: !!link,
    });

    const { data: ownerUserData, isLoading: userLoading } = useQuery({
        queryKey: ['user', goal?.userId],
        queryFn: async () => {
            if (!goal?.userId) return null;
            const res = await userService.getUser({
                params: {
                    path: { id: goal.userId },
                    query: { 'include[]': ['userDisciplines', 'userRoles'] },
                },
            });
            return res.data ?? null;
        },
        enabled: !!goal?.userId,
    });

    const ownerUser = ownerUserData ?? null;

    const {
        isAdmin,
        canAccessSubpage,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser: ownerUser,
    });

    const isOwner = !!(currentUser?.id && goal?.userId && currentUser.id === goal.userId);
    const canManage = isOwner || isAdmin;

    const { collaboratorOptions } = useMyFriends();

    const participantUserIds = useMemo(() => goal?.participants?.map((p) => p.userId) ?? [], [goal?.participants]);

    const { getUser } = useUsersMap(participantUserIds);

    const allResults = useMemo(() => {
        const list =
            goal?.participants?.flatMap((p) =>
                (p.results ?? []).map((res: GoalParticipantResultResource) => ({
                    ...res,
                    userId: p.userId,
                })),
            ) ?? [];

        return list.sort((a, b) => (a.time || Infinity) - (b.time || Infinity));
    }, [goal?.participants]);

    const updateStatusMutation = useMutation({
        mutationFn: (status: GoalStatusEnum) => {
            if (!goal?.id) throw new Error('No goal');
            return goalService.updateGoalStatus({
                params: { path: { id: goal.id } },
                body: { status },
            });
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifySuccess(t('statusUpdated'), t('goals'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: SaveStatusEnum }) =>
            goalService.updateGoalParticipantStatus({
                params: { path: { id: participantId } },
                body: { status },
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifySuccess(t('statusUpdated'), t('participants'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const updateResultStatusMutation = useMutation({
        mutationFn: ({ resultId, status }: { resultId: string; status: SaveStatusEnum }) =>
            goalService.updateGoalParticipantResultStatus({
                params: { path: { id: resultId } },
                body: { status },
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifySuccess(t('statusUpdated'), t('goals'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!goal?.id) return;
            await goalService.deleteGoal({ params: { path: { id: goal.id } } });
        },
        onSuccess: () => {
            notifySuccess(t('deleted'), t('goals'));
            navigate(ownerUser?.link ? `/users/${ownerUser.link}/goals` : (-1 as unknown as string));
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

    if (goalLoading || userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!goal) {
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
                            <Title order={2}>{goal.text}</Title>
                            <Group gap="xs" align="center" mt={2}>
                                <Text size="sm" c="dimmed">
                                    @{goal.link}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    •
                                </Text>
                                <EntityViewCounter entityId={goal.id} type={EntryTypeEnum.GOAL} />
                            </Group>
                            {(goal.startedAt || goal.endedAt) && (
                                <Group gap="xs" mt={4}>
                                    <IconClock size={16} />
                                    <Text size="xs" c="dimmed">
                                        {goal.startedAt ? formatDateTime(goal.startedAt) : ''} -{' '}
                                        {goal.endedAt ? formatDateTime(goal.endedAt) : ''}
                                    </Text>
                                </Group>
                            )}
                        </div>

                        <Group gap="xs" wrap="nowrap">
                            {canManage && (
                                <StatusActionMenu
                                    status={goal.status}
                                    options={GoalStatusEnum.getOptions(t)}
                                    onStatusChange={(status) => updateStatusMutation.mutate(status as GoalStatusEnum)}
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

                    <Group mb="md" wrap="wrap">
                        <Badge>
                            {DisciplineEnum.getOptions(t).find((o) => o.value === goal.discipline)?.label ??
                                goal.discipline}
                        </Badge>
                        <Badge color={primaryColor} variant="outline">
                            {formatDistance(goal.distance)}
                        </Badge>
                        {goal.time && (
                            <Badge color={primaryColor} variant="outline">
                                {formatTime(goal.time)}
                            </Badge>
                        )}
                        <StatusBadge status={goal.status} enumType={GoalStatusEnum} />
                    </Group>

                    <Title order={4} mb="xs">
                        {t('participants')}
                    </Title>
                    <Table.ScrollContainer minWidth={500}>
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
                                {!goal.participants || goal.participants.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={3} className="table-cell-empty">
                                            <EmptyState title={t('noData')} />
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    goal.participants.map((p: GoalParticipantResource) => {
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
                                    })
                                )}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>

                    <Title order={4} mt="lg" mb="xs">
                        {t('results')}
                    </Title>
                    <Table.ScrollContainer minWidth={500}>
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>{t('user')}</Table.Th>
                                    <Table.Th>{t('distance')}</Table.Th>
                                    <Table.Th>{t('time')}</Table.Th>
                                    <Table.Th>{t('pace')}</Table.Th>
                                    <Table.Th>{t('speed')}</Table.Th>
                                    <Table.Th>{t('status')}</Table.Th>
                                    <Table.Th>{t('createdAt')}</Table.Th>
                                    <Table.Th w={120} ta="right">
                                        {t('actions')}
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {allResults.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={8} className="table-cell-empty">
                                            <EmptyState title={t('noData')} />
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    allResults.map((res) => {
                                        const u = getUser(res.userId);
                                        const isSelf = res.userId === currentUser?.id;
                                        const paceSecPerKm = calculatePace(res.distance, res.time);
                                        const speedKmH = calculateSpeed(res.distance, res.time);

                                        return (
                                            <Table.Tr key={res.id}>
                                                <Table.Td>
                                                    <UserInfoCell user={u} userId={res.userId} />
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">{formatDistance(res.distance)}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">{formatTime(res.time)}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">{formatPace(paceSecPerKm)}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">{formatSpeed(speedKmH)}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <StatusBadge status={res.status} enumType={SaveStatusEnum} />
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed">
                                                        {formatDateTime(res.createdAt)}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                                                        {u?.link && <ViewActionButton to={`/users/${u.link}`} />}
                                                        {isSelf && (
                                                            <StatusActionMenu
                                                                status={res.status}
                                                                options={SaveStatusEnum.getOptions(t)}
                                                                onStatusChange={(status) =>
                                                                    updateResultStatusMutation.mutate({
                                                                        resultId: res.id,
                                                                        status: status as SaveStatusEnum,
                                                                    })
                                                                }
                                                                isPending={updateResultStatusMutation.isPending}
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
                </Card>

                <GoalFormModal
                    opened={editOpened}
                    onClose={closeEdit}
                    goal={goal}
                    collaboratorOptions={collaboratorOptions}
                    onSuccess={() => void queryClient.invalidateQueries({ queryKey: ['goal', link] })}
                />
            </Stack>
        </MantineThemeProvider>
    );
}
