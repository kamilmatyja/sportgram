import { useState, useMemo } from 'react';
import { Text, SimpleGrid, Select, Badge, Group, Avatar } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import {
    eventService,
    pageService,
    type EventDisciplineDistanceListResource,
    type GetEventDisciplineDistancesQuery,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import { RoleEnum } from '../../enums/RoleEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { formatImageSrc } from '../../utils/imageUtils';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';

export default function UserEventSignups() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const tableState = useDataTableState({
        defaultSort: 'createdAt:desc',
    });

    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== null) count++;
        return count;
    }, [statusFilter]);

    const handleResetFilters = () => {
        setStatusFilter(null);
        tableState.resetPage();
    };

    return (
        <UserSubpageContainer requiredRole={RoleEnum.PARTICIPANT}>
            {({ targetUser, isOwner }) => {
                const primaryColor = ColorEnum.getMantineColor(targetUser.color);

                const queryFilter = {
                    userId: targetUser.id,
                    status: statusFilter ? (Number(statusFilter) as 1 | 2 | 3) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'user-event-signups',
                        targetUser.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () =>
                        eventService.getEventDisciplineDistanceLists({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter,
                                    sort:
                                        (tableState.sort as NonNullable<GetEventDisciplineDistancesQuery>['sort']) ??
                                        'createdAt:desc',
                                },
                            },
                        }),
                });

                const signups = data?.data ?? [];
                const pagination = data?.pagination;

                const { data: eventsData } = useQuery({
                    queryKey: ['all-events-for-signups'],
                    queryFn: async () => {
                        const res = await eventService.getEvents({
                            params: {
                                query: {
                                    limit: 100,
                                    'include[]': ['eventDisciplines', 'eventDisciplineDistances'],
                                },
                            },
                        });
                        return res.data ?? [];
                    },
                });

                const { data: myPagesData } = useQuery({
                    queryKey: ['my-pages-for-signups', currentUser?.id],
                    queryFn: async () => {
                        if (!currentUser?.id) return [];
                        const res = await pageService.getPages({
                            params: {
                                query: {
                                    filter: { userId: currentUser.id },
                                    limit: 100,
                                    'include[]': ['pageParticipants'],
                                },
                            },
                        });
                        return res?.data ?? [];
                    },
                    enabled: !!currentUser?.id,
                });

                const myPageParticipantIds = useMemo(() => {
                    const set = new Set<string>();
                    myPagesData?.forEach((p) => {
                        p.participants?.forEach((part) => {
                            if (part.userId === currentUser?.id) {
                                set.add(part.id);
                            }
                        });
                    });
                    return set;
                }, [myPagesData, currentUser?.id]);

                const distanceLookup = useMemo(() => {
                    const map: Record<
                        string,
                        {
                            eventTitle: string;
                            eventLink: string;
                            eventPhoto?: string;
                            pageParticipantId: string;
                            discipline?: number;
                            distance?: number;
                        }
                    > = {};
                    eventsData?.forEach((event) => {
                        event.disciplines?.forEach((discipline) => {
                            discipline.distances?.forEach((dist) => {
                                map[dist.id] = {
                                    eventTitle: event.title,
                                    eventLink: event.link,
                                    eventPhoto: event.photo,
                                    pageParticipantId: event.pageParticipantId,
                                    discipline: discipline.discipline,
                                    distance: dist.distance,
                                };
                            });
                        });
                    });
                    return map;
                }, [eventsData]);

                const statusMutation = useMutation({
                    mutationFn: async ({ id, status }: { id: string; status: number }) => {
                        await eventService.updateEventDisciplineDistanceListStatus({
                            params: { path: { id } },
                            body: { status: status as 1 | 2 | 3 },
                        });
                    },
                    onSuccess: () => {
                        queryClient.invalidateQueries({
                            queryKey: ['user-event-signups', targetUser.id],
                        });
                        notifications.show({
                            title: t('eventSignups'),
                            message: t('statusUpdated'),
                            color: 'green',
                        });
                    },
                    onError: (err) => {
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
                    },
                });

                const deleteMutation = useMutation({
                    mutationFn: async (id: string) => {
                        await eventService.deleteEventDisciplineDistanceList({
                            params: { path: { id } },
                        });
                    },
                    onSuccess: () => {
                        queryClient.invalidateQueries({
                            queryKey: ['user-event-signups', targetUser.id],
                        });
                        notifications.show({
                            title: t('eventSignups'),
                            message: t('deleted', 'Usunięto'),
                            color: 'green',
                        });
                    },
                    onError: (err) => {
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
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

                const columns: Column<EventDisciplineDistanceListResource>[] = [
                    {
                        key: 'event',
                        header: t('events'),
                        render: (s) => {
                            const info = distanceLookup[s.eventDisciplineDistanceId];
                            return (
                                <Group gap="sm" wrap="nowrap">
                                    <Avatar src={formatImageSrc(info?.eventPhoto)}>?</Avatar>
                                    <div>
                                        <Text size="sm" fw={600} lineClamp={1}>
                                            {info?.eventTitle ?? s.eventDisciplineDistanceId}
                                        </Text>
                                        {info?.eventLink && (
                                            <Text size="sm" c="dimmed" lineClamp={1}>
                                                @{info.eventLink}
                                            </Text>
                                        )}
                                    </div>
                                </Group>
                            );
                        },
                    },
                    {
                        key: 'discipline',
                        header: t('discipline'),
                        render: (s) => {
                            const info = distanceLookup[s.eventDisciplineDistanceId];
                            const disciplineLabel = info?.discipline
                                ? (DisciplineEnum.getOptions(t).find((o) => o.value === info.discipline)?.label ??
                                  info.discipline)
                                : null;
                            return disciplineLabel ? <Badge color={primaryColor}>{disciplineLabel}</Badge> : null;
                        },
                    },
                    {
                        key: 'distance',
                        header: t('distance'),
                        render: (s) => {
                            const info = distanceLookup[s.eventDisciplineDistanceId];
                            return info?.distance !== undefined ? (
                                <Badge variant="outline" color={primaryColor}>
                                    {info.distance} m
                                </Badge>
                            ) : null;
                        },
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (s) => <StatusBadge status={s.status} enumType={SaveStatusEnum} />,
                    },
                    {
                        key: 'createdAt',
                        header: t('createdAt'),
                        render: (s) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(s.createdAt)}
                            </Text>
                        ),
                    },
                ];

                const filtersNode = (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <Select
                            label={t('status')}
                            placeholder={t('allStatuses')}
                            data={SaveStatusEnum.getOptions(t).map((s) => ({
                                value: String(s.value),
                                label: s.label,
                            }))}
                            value={statusFilter}
                            onChange={(v) => {
                                setStatusFilter(v);
                                tableState.resetPage();
                            }}
                            clearable
                        />
                    </SimpleGrid>
                );

                return (
                    <DataTable
                        columns={columns}
                        data={signups}
                        isLoading={isLoading}
                        totalItems={pagination?.total}
                        state={tableState}
                        filtersNode={filtersNode}
                        activeFiltersCount={activeFiltersCount}
                        onResetFilters={handleResetFilters}
                        actions={(s) => {
                            const info = distanceLookup[s.eventDisciplineDistanceId];
                            const isEventOwner = !!(
                                info?.pageParticipantId && myPageParticipantIds.has(info.pageParticipantId)
                            );
                            const canChangeStatus = isOwner || isEventOwner;

                            return (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    {info?.eventLink && <ViewActionButton to={`/events/${info.eventLink}`} />}
                                    {canChangeStatus && (
                                        <StatusActionMenu
                                            value={s.status}
                                            enumType={SaveStatusEnum}
                                            onChange={(status) =>
                                                statusMutation.mutate({
                                                    id: s.id,
                                                    status: status as number,
                                                })
                                            }
                                            loading={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => handleDelete(s.id)}
                                            loading={deleteMutation.isPending}
                                        />
                                    )}
                                </Group>
                            );
                        }}
                    />
                );
            }}
        </UserSubpageContainer>
    );
}
