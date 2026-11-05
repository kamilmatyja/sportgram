import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import {
    Text,
    Center,
    Loader,
    Stack,
    ActionIcon,
    Tooltip,
    SimpleGrid,
    Select,
    Badge,
    Group,
    Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconAdjustments, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import {
    userService,
    eventService,
    pageService,
    type EventDisciplineDistanceListResource,
    type GetEventDisciplineDistancesQuery,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { RoleEnum } from '../../enums/RoleEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';

export default function UserEventSignups() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const {
        isOwner,
        canAccessSubpage,
        hasRequiredRole,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser,
        requiredRole: RoleEnum.PARTICIPANT,
    });

    const primaryColor = ColorEnum.getMantineColor(targetUser?.color);

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
    ];

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== null) count++;
        return count;
    }, [statusFilter]);

    const handleResetFilters = () => {
        setStatusFilter(null);
        setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            userId: targetUser?.id ?? null,
            status: statusFilter ? (Number(statusFilter) as 1 | 2 | 3) : null,
        };
    }, [targetUser?.id, statusFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['user-event-signups', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return eventService.getEventDisciplineDistances({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetEventDisciplineDistancesQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id && canAccessSubpage && hasRequiredRole,
    });

    const signups = data?.data ?? [];
    const pagination = data?.pagination;

    const { data: eventsData } = useQuery({
        queryKey: ['all-events-for-signups'],
        queryFn: async () => {
            const res = await eventService.getEvents({
                limit: 100,
                'include[]': ['eventDisciplines', 'eventDisciplineDistances'],
            });
            return res.data ?? [];
        },
    });

    const { data: myPagesData } = useQuery({
        queryKey: ['my-pages-for-signups', currentUser?.id],
        queryFn: async () => {
            if (!currentUser?.id) return [];
            const res = await pageService.getPages({
                filter: { userId: currentUser.id },
                limit: 100,
                'include[]': ['pageParticipants'],
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
            { eventTitle: string; eventLink: string; pageParticipantId: string; discipline?: number; distance?: number }
        > = {};
        eventsData?.forEach((event) => {
            event.disciplines?.forEach((discipline) => {
                discipline.distances?.forEach((dist) => {
                    map[dist.id] = {
                        eventTitle: event.title,
                        eventLink: event.link,
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
            await eventService.updateEventDisciplineDistanceListStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-event-signups', targetUser?.id] });
            notifications.show({ title: t('eventSignups'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await eventService.deleteEventDisciplineDistanceList(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-event-signups', targetUser?.id] });
            notifications.show({ title: t('eventSignups'), message: t('deleted', 'Usunięto'), color: 'green' });
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

    const columns: Column<EventDisciplineDistanceListResource>[] = [
        {
            key: 'event',
            header: t('events'),
            render: (s) => {
                const info = distanceLookup[s.eventDisciplineDistanceId];
                return (
                    <div>
                        <Text size="sm" fw={600}>
                            {info?.eventTitle ?? s.eventDisciplineDistanceId}
                        </Text>
                        {info?.eventLink && (
                            <Text size="sm" c="dimmed">
                                @{info.eventLink}
                            </Text>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'discipline',
            header: t('discipline'),
            render: (s) => {
                const info = distanceLookup[s.eventDisciplineDistanceId];
                const disciplineLabel = info?.discipline
                    ? (DisciplineEnum.getOptions(t).find((o) => o.value === info.discipline)?.label ?? info.discipline)
                    : null;
                return disciplineLabel ? (
                    <Badge variant="light" color={primaryColor}>
                        {disciplineLabel}
                    </Badge>
                ) : null;
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
            render: (s) => {
                let color = 'gray';
                let label = '';
                switch (s.status) {
                    case SaveStatusEnum.PENDING:
                        color = 'gray';
                        label = t('saveStatuses.pending');
                        break;
                    case SaveStatusEnum.ACCEPTED:
                        color = 'green';
                        label = t('saveStatuses.accepted');
                        break;
                    case SaveStatusEnum.REJECTED:
                        color = 'red';
                        label = t('saveStatuses.rejected');
                        break;
                }
                return (
                    <Badge color={color} variant="light">
                        {label || s.status}
                    </Badge>
                );
            },
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
                data={SaveStatusEnum.getOptions(t).map((s) => ({ value: String(s.value), label: s.label }))}
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
                data={signups}
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
                actions={(s) => {
                    const info = distanceLookup[s.eventDisciplineDistanceId];
                    const isEventOwner = !!(
                        info?.pageParticipantId && myPageParticipantIds.has(info.pageParticipantId)
                    );
                    const canChangeStatus = isOwner || isEventOwner;

                    return (
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                            {info?.eventLink && (
                                <Tooltip label={t('details')} withArrow>
                                    <ActionIcon
                                        component={Link}
                                        to={`/events/${info.eventLink}`}
                                        variant="light"
                                        size={30}
                                        aria-label={t('details')}
                                    >
                                        <IconEye size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                            {canChangeStatus && (
                                <Menu shadow="md" width={160} position="bottom-end">
                                    <Menu.Target>
                                        <Tooltip label={t('changeStatus')} withArrow>
                                            <ActionIcon
                                                variant="light"
                                                size={30}
                                                aria-label={t('changeStatus')}
                                                loading={statusMutation.isPending}
                                            >
                                                <IconAdjustments size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        {SaveStatusEnum.getOptions(t).map((opt) => (
                                            <Menu.Item
                                                key={opt.value}
                                                disabled={s.status === opt.value || statusMutation.isPending}
                                                onClick={() =>
                                                    statusMutation.mutate({
                                                        id: s.id,
                                                        status: opt.value,
                                                    })
                                                }
                                            >
                                                {opt.label}
                                            </Menu.Item>
                                        ))}
                                    </Menu.Dropdown>
                                </Menu>
                            )}
                            {isOwner && (
                                <Tooltip label={t('delete')} withArrow>
                                    <ActionIcon
                                        variant="light"
                                        color="red"
                                        size={30}
                                        onClick={() => handleDelete(s.id)}
                                        aria-label={t('delete')}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </Group>
                    );
                }}
            />
        </Stack>
    );
}
