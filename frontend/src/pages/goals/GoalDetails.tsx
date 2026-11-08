import { useMemo, useEffect } from 'react';
import { Card, Title, Text, Group, Stack, Badge, Table, MantineThemeProvider, Center, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconClock } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { applyThemeColor } from '../../utils/themeUtils';
import NotFound from '../../components/NotFound';
import { EmptyState } from '../../components/EmptyState';
import { getErrorMessage } from '../../api/client';
import {
    goalService,
    userService,
    type GoalParticipantResource,
    type GoalParticipantResultResource,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { EntityViewCounter } from '../../components/EntityViewCounter';
import UserProfileNav from '../../components/UserProfileNav';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { brown } from '../../theme';
import { formatDateTime } from '../../utils/date';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { EditActionButton, DeleteActionButton, ViewActionButton } from '../../components/common/RowActionButtons';
import { GoalFormModal } from '../../components/goals/GoalFormModal';
import { useUsersMap } from '../../hooks/useUsersMap';
import { useMyFriends } from '../../hooks/useMyFriends';
import { UserInfoCell } from '../../components/common/UserInfoCell';

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
                        'include[]': ['goalParticipants'],
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

    const participantUserIds = useMemo(() => {
        if (!goal?.participants) return [];
        return goal.participants.map((p) => p.userId);
    }, [goal?.participants]);

    const { getUser } = useUsersMap(participantUserIds);

    const updateStatusMutation = useMutation({
        mutationFn: (status: GoalStatusEnum) => {
            if (!goal?.id) throw new Error('No goal');
            return goalService.updateGoalStatus({
                params: { path: { id: goal.id } },
                body: { status },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifications.show({ title: t('goals'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: ElementStatusEnum }) =>
            goalService.updateGoalParticipantStatus({
                params: { path: { id: participantId } },
                body: { status },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifications.show({ title: t('participants'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateResultStatusMutation = useMutation({
        mutationFn: ({ resultId, status }: { resultId: string; status: ElementStatusEnum }) =>
            goalService.updateGoalParticipantResultStatus({
                params: { path: { id: resultId } },
                body: { status },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifications.show({ title: t('goals'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!goal?.id) return;
            await goalService.deleteGoal({
                params: { path: { id: goal.id } },
            });
        },
        onSuccess: () => {
            notifications.show({ title: t('goals'), message: t('goalDeleted'), color: 'green' });
            navigate(ownerUser?.link ? `/users/${ownerUser.link}/goals` : (-1 as unknown as string));
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

    if (goalLoading || userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!goal) {
        return <NotFound title={t('goalNotFound')} />;
    }

    if (!canAccessSubpage) {
        return <NotFound title={t('accessDenied')} />;
    }

    return (
        <MantineThemeProvider theme={{ primaryColor, colors: { brown } }} inherit>
            <Stack gap="lg">
                {ownerUser && <UserProfileNav user={ownerUser} isOwner={isOwner} />}

                <Card p="lg">
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
                                        onClick={handleDelete}
                                        loading={deleteMutation.isPending}
                                        disabled={deleteMutation.isPending}
                                    />
                                </>
                            )}
                        </Group>
                    </Group>

                    <Group gap="sm" mb="md" wrap="wrap">
                        <Badge>
                            {DisciplineEnum.getOptions(t).find((o) => o.value === goal.discipline)?.label ??
                                goal.discipline}
                        </Badge>
                        <Badge color={primaryColor} variant="outline">
                            {goal.distance} m
                        </Badge>
                        {goal.time && (
                            <Badge color={primaryColor} variant="outline">
                                {goal.time} s
                            </Badge>
                        )}
                        <StatusBadge status={goal.status} enumType={GoalStatusEnum} />
                    </Group>

                    <Title order={4} mb="xs">
                        {t('participants')}
                    </Title>
                    {!goal.participants || goal.participants.length === 0 ? (
                        <EmptyState title={t('noData')} />
                    ) : (
                        <Table.ScrollContainer minWidth={600}>
                            <Table verticalSpacing="sm">
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
                                    {goal.participants?.map((p: GoalParticipantResource) => {
                                        const u = getUser(p.userId);
                                        const isSelf = p.userId === currentUser?.id;
                                        const canManageParticipant = isSelf;

                                        return (
                                            <Table.Tr key={p.id}>
                                                <Table.Td>
                                                    <UserInfoCell user={u} userId={p.userId} />
                                                </Table.Td>
                                                <Table.Td>
                                                    <StatusBadge status={p.status} />
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
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}

                    {goal.participants?.some((p) => p.results && p.results.length > 0) && (
                        <Stack gap="sm" mt="lg">
                            <Title order={4}>{t('results')}</Title>
                            <Table.ScrollContainer minWidth={600}>
                                <Table verticalSpacing="sm">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>{t('user')}</Table.Th>
                                            <Table.Th>{t('distanceMeters')}</Table.Th>
                                            <Table.Th>{t('timeSeconds')}</Table.Th>
                                            <Table.Th>{t('status')}</Table.Th>
                                            <Table.Th>{t('createdAt')}</Table.Th>
                                            <Table.Th w={120} ta="right">
                                                {t('actions')}
                                            </Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {goal.participants.flatMap((p) => {
                                            if (!p.results || p.results.length === 0) return [];
                                            const u = getUser(p.userId);
                                            const isSelf = p.userId === currentUser?.id;
                                            const canManageResult = isSelf;

                                            return p.results.map((res: GoalParticipantResultResource) => {
                                                return (
                                                    <Table.Tr key={res.id}>
                                                        <Table.Td>
                                                            <UserInfoCell user={u} userId={p.userId} />
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="sm">{res.distance} m</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="sm">{res.time} s</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <StatusBadge status={res.status} />
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="sm" c="dimmed">
                                                                {formatDateTime(res.createdAt)}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td ta="right">
                                                            <Group gap="xs" justify="flex-end" wrap="nowrap">
                                                                {u?.link && (
                                                                    <ViewActionButton to={`/users/${u.link}`} />
                                                                )}
                                                                {canManageResult && (
                                                                    <StatusActionMenu
                                                                        status={res.status}
                                                                        onStatusChange={(status) =>
                                                                            updateResultStatusMutation.mutate({
                                                                                resultId: res.id,
                                                                                status: status as ElementStatusEnum,
                                                                            })
                                                                        }
                                                                        isPending={updateResultStatusMutation.isPending}
                                                                    />
                                                                )}
                                                            </Group>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                );
                                            });
                                        })}
                                    </Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>
                        </Stack>
                    )}
                </Card>

                <GoalFormModal
                    opened={editOpened}
                    onClose={closeEdit}
                    goal={goal}
                    collaboratorOptions={collaboratorOptions}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['goal', link] })}
                />
            </Stack>
        </MantineThemeProvider>
    );
}
