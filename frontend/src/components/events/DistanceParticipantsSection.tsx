import React, { useState } from 'react';
import {
    Paper,
    Group,
    Badge,
    Button,
    Center,
    Loader,
    Stack,
    Table,
    Text,
    Tooltip,
    ActionIcon,
    TextInput,
} from '@mantine/core';
import { IconCheck, IconPlus, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { getErrorMessage } from '../../api/client';
import {
    eventService,
    type EventDisciplineDistanceResource,
    type EventDisciplineDistanceListResource,
    type EventDisciplineDistanceResultResource,
} from '../../api/services';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { EmptyState } from '../EmptyState';
import { StatusBadge } from '../common';
import { StatusActionMenu } from '../common';
import { EditActionButton, DeleteActionButton, ViewActionButton } from '../common';
import { UserInfoCell } from '../common';
import { useUsersMap } from '../../hooks';
import { useFormErrors } from '../../hooks';
import {
    openConfirmActionModal,
    formatDistance,
    formatTime,
    formatPace,
    formatSpeed,
    calculatePace,
    calculateSpeed,
    calculateSplitPace,
    calculateSplitSpeed,
} from '../../utils';
import { InteractionModal as Modal } from '../common/InteractionModal';

export interface DistanceParticipantsProps {
    distance: EventDisciplineDistanceResource;
    isOwner: boolean;
    isAdmin?: boolean;
    isParticipant: boolean;
    currentUserId?: string;
    onSignUp: (distId: string) => void;
    isSigningUp: boolean;
    primaryColor?: string;
}

interface ResultModalState {
    mode: 'add' | 'edit';
    targetId: string;
    time: string;
    subTimes: string[];
}

export function DistanceParticipantsSection({
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
    const [expandedResultIds, setExpandedResultIds] = useState<string[]>([]);
    const [resultModal, setResultModal] = useState<ResultModalState | null>(null);
    const { errors, setFromError, clearFieldError, clearErrors } = useFormErrors();

    const toggleExpandParticipant = (id: string) => {
        setExpandedParticipantIds((prev) => (prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]));
    };

    const toggleExpandResult = (id: string) => {
        setExpandedResultIds((prev) => (prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]));
    };

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
                body: { status: status },
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('participants'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const saveResultMutation = useMutation({
        mutationFn: async () => {
            if (!resultModal) return;
            const subResults = (distance.subDistances || [])
                .map((sd, idx) => {
                    const val = resultModal.subTimes[idx];
                    if (!val || !val.trim()) return null;
                    return {
                        eventDisciplineSubDistanceId: sd.id,
                        time: Math.round(Number(val)) || 0,
                    };
                })
                .filter((sr): sr is { eventDisciplineSubDistanceId: string; time: number } => sr !== null);

            const payload = {
                time: Math.round(Number(resultModal.time)) || 0,
                subResults,
            };

            if (resultModal.mode === 'add') {
                await eventService.createEventDisciplineDistanceResult({
                    params: { path: { id: resultModal.targetId } },
                    body: payload,
                });
            } else {
                await eventService.updateEventDisciplineDistanceResult({
                    params: { path: { id: resultModal.targetId } },
                    body: payload,
                });
            }
        },
        onSuccess: () => {
            if (resultModal?.mode === 'add' && resultModal.targetId) {
                const targetId = resultModal.targetId;
                setExpandedParticipantIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
            }
            const isAdd = resultModal?.mode === 'add';
            clearErrors();
            setResultModal(null);
            void queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({
                title: t('events'),
                message: isAdd ? t('created') : t('saved'),
                color: 'green',
            });
        },
        onError: (err) => {
            setFromError(err);
        },
    });

    const deleteResultMutation = useMutation({
        mutationFn: (resultId: string) =>
            eventService.deleteEventDisciplineDistanceResult({
                params: { path: { id: resultId } },
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('events'), message: t('deleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenAddResult = (participantId: string) => {
        clearErrors();
        setResultModal({
            mode: 'add',
            targetId: participantId,
            time: '',
            subTimes: (distance.subDistances || []).map(() => ''),
        });
    };

    const handleOpenEditResult = (res: EventDisciplineDistanceResultResource) => {
        clearErrors();
        const subDistances = distance.subDistances || [];
        const subTimes = subDistances.map((sd) => {
            const match = res.subResults?.find((sr) => sr.eventDisciplineSubDistanceId === sd.id);
            return match?.time != null ? String(match.time) : '';
        });
        setResultModal({
            mode: 'edit',
            targetId: res.id,
            time: String(res.time ?? ''),
            subTimes,
        });
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
        <Paper p="sm" mb="sm">
            <Group justify="space-between" mb="xs">
                <Badge color={primaryColor} variant="outline">
                    {formatDistance(distance.distance)}
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
            ) : (
                <Stack gap="sm">
                    <Table.ScrollContainer minWidth={500}>
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th w={46} />
                                    <Table.Th>{t('user')}</Table.Th>
                                    <Table.Th>{t('status')}</Table.Th>
                                    <Table.Th w={120} ta="right">
                                        {t('actions')}
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {participants.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={4} className="table-cell-empty">
                                            <EmptyState title={t('noData')} />
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    participants.map((p: EventDisciplineDistanceListResource, pIdx: number) => {
                                        const u = getUser(p.userId);
                                        const isSelf = p.userId === currentUserId;
                                        const canManageParticipant = isSelf || isOwner;
                                        const hasResults = p.results && p.results.length > 0;
                                        const isParticipantExpanded = expandedParticipantIds.includes(p.id);

                                        return (
                                            <React.Fragment key={p.id}>
                                                <Table.Tr
                                                    className={pIdx % 2 === 0 ? 'table-row-odd' : 'table-row-even'}
                                                >
                                                    <Table.Td>
                                                        {hasResults ? (
                                                            <Tooltip label={t('results')}>
                                                                <ActionIcon
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
                                                                            status: status,
                                                                        })
                                                                    }
                                                                    isPending={
                                                                        updateParticipantStatusMutation.isPending
                                                                    }
                                                                />
                                                            )}
                                                            {isOwner &&
                                                                p.status === ElementStatusEnum.ACTIVE &&
                                                                (!p.results || p.results.length === 0) && (
                                                                    <Button
                                                                        size="xs"
                                                                        variant="default"
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
                                                        <Table.Td colSpan={4} p={0}>
                                                            <Table>
                                                                <Table.Thead>
                                                                    <Table.Tr>
                                                                        <Table.Th w={46} />
                                                                        <Table.Th>{t('distance')}</Table.Th>
                                                                        <Table.Th>{t('time')}</Table.Th>
                                                                        <Table.Th>{t('pace')}</Table.Th>
                                                                        <Table.Th>{t('speed')}</Table.Th>
                                                                        <Table.Th w={120} ta="right">
                                                                            {t('actions')}
                                                                        </Table.Th>
                                                                    </Table.Tr>
                                                                </Table.Thead>
                                                                <Table.Tbody>
                                                                    {p.results.map(
                                                                        (
                                                                            res: EventDisciplineDistanceResultResource,
                                                                            rIdx: number,
                                                                        ) => {
                                                                            const hasSubResults =
                                                                                res.subResults &&
                                                                                res.subResults.length > 0;
                                                                            const isSubExpanded =
                                                                                expandedResultIds.includes(res.id);
                                                                            const paceSecPerKm = calculatePace(
                                                                                distance.distance,
                                                                                res.time,
                                                                            );
                                                                            const speedKmH = calculateSpeed(
                                                                                distance.distance,
                                                                                res.time,
                                                                            );

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
                                                                                                >
                                                                                                    <ActionIcon
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
                                                                                                                size={
                                                                                                                    16
                                                                                                                }
                                                                                                            />
                                                                                                        ) : (
                                                                                                            <IconChevronRight
                                                                                                                size={
                                                                                                                    16
                                                                                                                }
                                                                                                            />
                                                                                                        )}
                                                                                                    </ActionIcon>
                                                                                                </Tooltip>
                                                                                            ) : null}
                                                                                        </Table.Td>
                                                                                        <Table.Td>
                                                                                            <Text size="sm">
                                                                                                {formatDistance(
                                                                                                    distance.distance,
                                                                                                )}
                                                                                            </Text>
                                                                                        </Table.Td>
                                                                                        <Table.Td>
                                                                                            <Text size="sm">
                                                                                                {formatTime(res.time)}
                                                                                            </Text>
                                                                                        </Table.Td>
                                                                                        <Table.Td>
                                                                                            <Text size="sm">
                                                                                                {formatPace(
                                                                                                    paceSecPerKm,
                                                                                                )}
                                                                                            </Text>
                                                                                        </Table.Td>
                                                                                        <Table.Td>
                                                                                            <Text size="sm">
                                                                                                {formatSpeed(speedKmH)}
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
                                                                                            <Table.Td colSpan={6} p={0}>
                                                                                                <Table verticalSpacing="xs">
                                                                                                    <Table.Thead>
                                                                                                        <Table.Tr>
                                                                                                            <Table.Th>
                                                                                                                {t(
                                                                                                                    'subDistance',
                                                                                                                )}
                                                                                                            </Table.Th>
                                                                                                            <Table.Th>
                                                                                                                {t(
                                                                                                                    'time',
                                                                                                                )}
                                                                                                            </Table.Th>
                                                                                                            <Table.Th>
                                                                                                                {t(
                                                                                                                    'pace',
                                                                                                                )}
                                                                                                            </Table.Th>
                                                                                                            <Table.Th>
                                                                                                                {t(
                                                                                                                    'speed',
                                                                                                                )}
                                                                                                            </Table.Th>
                                                                                                        </Table.Tr>
                                                                                                    </Table.Thead>
                                                                                                    <Table.Tbody>
                                                                                                        {res.subResults.map(
                                                                                                            (
                                                                                                                sr,
                                                                                                                idx,
                                                                                                            ) => {
                                                                                                                const sd =
                                                                                                                    distance.subDistances?.find(
                                                                                                                        (
                                                                                                                            d,
                                                                                                                        ) =>
                                                                                                                            d.id ===
                                                                                                                            sr.eventDisciplineSubDistanceId,
                                                                                                                    );
                                                                                                                let subPaceSecPerKm: number;
                                                                                                                let subSpeedKmH: number;
                                                                                                                const curDist =
                                                                                                                    sd
                                                                                                                        ? sd.subDistance
                                                                                                                        : 0;
                                                                                                                if (
                                                                                                                    idx ===
                                                                                                                    0
                                                                                                                ) {
                                                                                                                    subPaceSecPerKm =
                                                                                                                        calculatePace(
                                                                                                                            curDist,
                                                                                                                            sr.time,
                                                                                                                        );
                                                                                                                    subSpeedKmH =
                                                                                                                        calculateSpeed(
                                                                                                                            curDist,
                                                                                                                            sr.time,
                                                                                                                        );
                                                                                                                } else {
                                                                                                                    const prevSr =
                                                                                                                        res
                                                                                                                            .subResults[
                                                                                                                            idx -
                                                                                                                                1
                                                                                                                        ];
                                                                                                                    const prevSd =
                                                                                                                        distance.subDistances?.find(
                                                                                                                            (
                                                                                                                                d,
                                                                                                                            ) =>
                                                                                                                                d.id ===
                                                                                                                                prevSr.eventDisciplineSubDistanceId,
                                                                                                                        );
                                                                                                                    const prevDist =
                                                                                                                        prevSd
                                                                                                                            ? prevSd.subDistance
                                                                                                                            : 0;
                                                                                                                    subPaceSecPerKm =
                                                                                                                        calculateSplitPace(
                                                                                                                            curDist,
                                                                                                                            prevDist,
                                                                                                                            sr.time,
                                                                                                                            prevSr.time,
                                                                                                                        );
                                                                                                                    subSpeedKmH =
                                                                                                                        calculateSplitSpeed(
                                                                                                                            curDist,
                                                                                                                            prevDist,
                                                                                                                            sr.time,
                                                                                                                            prevSr.time,
                                                                                                                        );
                                                                                                                }

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
                                                                                                                                    ? formatDistance(
                                                                                                                                          sd.subDistance,
                                                                                                                                      )
                                                                                                                                    : `#${idx + 1}`}
                                                                                                                            </Text>
                                                                                                                        </Table.Td>
                                                                                                                        <Table.Td>
                                                                                                                            <Text size="sm">
                                                                                                                                {formatTime(
                                                                                                                                    sr.time,
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
                                    })
                                )}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                </Stack>
            )}

            {resultModal && (
                <Modal
                    opened={true}
                    onClose={() => {
                        setResultModal(null);
                        clearErrors();
                    }}
                    title={resultModal.mode === 'add' ? t('addResult') : t('editResult')}
                >
                    <Stack gap="sm">
                        <TextInput
                            label={`${formatDistance(distance.distance)} (${t('time')})`}
                            placeholder={formatDistance(distance.distance)}
                            required
                            type="number"
                            value={resultModal.time}
                            onChange={(e) => {
                                const val = e.currentTarget.value;
                                setResultModal((prev) => (prev ? { ...prev, time: val } : null));
                                clearFieldError('time');
                            }}
                            error={errors.time}
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
                                        label={`${formatDistance(sd.subDistance)} (${t('time')})`}
                                        placeholder={formatDistance(sd.subDistance)}
                                        type="number"
                                        value={resultModal.subTimes[idx] ?? ''}
                                        onChange={(e) => {
                                            const val = e.currentTarget.value;
                                            setResultModal((prev) => {
                                                if (!prev) return null;
                                                const nextSubTimes = [...prev.subTimes];
                                                nextSubTimes[idx] = val;
                                                return { ...prev, subTimes: nextSubTimes };
                                            });
                                            clearFieldError(`subResults.${idx}.time`);
                                            clearFieldError(`subResults[${idx}].time`);
                                        }}
                                        error={
                                            errors[`subResults.${idx}.time`] ||
                                            errors[`subResults[${idx}].time`] ||
                                            (errors.subResults && !resultModal.subTimes[idx]?.trim()
                                                ? errors.subResults
                                                : undefined)
                                        }
                                    />
                                ))}
                            </Stack>
                        )}

                        <Button
                            mt="xs"
                            loading={saveResultMutation.isPending}
                            disabled={saveResultMutation.isPending || !resultModal.time.trim()}
                            onClick={() => saveResultMutation.mutate()}
                        >
                            {t('save')}
                        </Button>
                    </Stack>
                </Modal>
            )}
        </Paper>
    );
}
