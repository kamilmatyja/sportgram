import { useState } from 'react';
import { Text, SimpleGrid, Select, Badge, Group, Avatar } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    eventService,
    pageService,
    type EventDisciplineDistanceListResource,
    type GetEventDisciplineDistancesQuery,
} from '../../api/services';
import { useAuth } from '../../auth';
import {
    DataTable,
    type Column,
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    DeleteActionButton,
    UserSubpageContainer,
} from '../../components';
import { RoleEnum } from '../../enums/RoleEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { confirmDelete, formatDateTime, formatImageSrc, notifySuccess, notifyError, formatDistance } from '../../utils';
import { useDataTableState } from '../../hooks';

export default function UserEventSignups() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const tableState = useDataTableState({ initialSort: 'createdAt:desc' });
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

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

                const myPageParticipantIds = new Set<string>();
                myPagesData?.forEach((p) => {
                    p.participants?.forEach((part) => {
                        if (part.userId === currentUser?.id) {
                            myPageParticipantIds.add(part.id);
                        }
                    });
                });

                const distanceLookup: Record<
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
                            distanceLookup[dist.id] = {
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

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: number }) =>
                        eventService.updateEventDisciplineDistanceListStatus({
                            params: { path: { id } },
                            body: { status: status as 1 | 2 | 3 },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({
                            queryKey: ['user-event-signups', targetUser.id],
                        });
                        notifySuccess(t('statusUpdated'), t('eventSignups'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        eventService.deleteEventDisciplineDistanceList({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({
                            queryKey: ['user-event-signups', targetUser.id],
                        });
                        notifySuccess(t('deleted'), t('eventSignups'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const columns: Column<EventDisciplineDistanceListResource>[] = [
                    {
                        key: 'event',
                        header: t('events'),
                        render: (s) => {
                            const info = distanceLookup[s.eventDisciplineDistanceId];
                            return (
                                <Group wrap="nowrap">
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
                                    {formatDistance(info.distance)}
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
                    <SimpleGrid>
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
                        activeFiltersCount={statusFilter !== null ? 1 : 0}
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
                                            onClick={() => confirmDelete(t, () => deleteMutation.mutate(s.id))}
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
