import { useState, useMemo } from 'react';
import { Group, Text, Avatar, SimpleGrid, TextInput, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { eventService, pageService, type EventResource, type GetEventsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { formatImageSrc } from '../../utils/imageUtils';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { buildSortOptions } from '../../utils/tableUtils';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { EventFormModal } from '../../components/events/EventFormModal';

export default function UserEvents() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState({
        defaultSort: 'startedAt:desc',
    });

    const [titleFilter, setTitleFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingEvent, setEditingEvent] = useState<EventResource | null>(null);

    const sortOptions = buildSortOptions(t, ['startedAt', 'endedAt', 'title', 'location', 'status', 'createdAt']);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (titleFilter.trim()) count++;
        if (linkFilter.trim()) count++;
        if (statusFilter !== null) count++;
        return count;
    }, [titleFilter, linkFilter, statusFilter]);

    const handleResetFilters = () => {
        setTitleFilter('');
        setLinkFilter('');
        setStatusFilter(null);
        tableState.resetPage();
    };

    return (
        <UserSubpageContainer requiredRole={RoleEnum.ORGANIZER}>
            {({ targetUser, isOwner, isAdmin }) => {
                const canManage = isOwner || isAdmin;

                const { data: myPages } = useQuery({
                    queryKey: ['my-pages', targetUser.id],
                    queryFn: async () => {
                        const res = await pageService.getPages({
                            params: {
                                query: {
                                    filter: { userId: targetUser.id },
                                    limit: 50,
                                    'include[]': ['pageParticipants'],
                                },
                            },
                        });
                        return res?.data ?? [];
                    },
                    enabled: canManage,
                });

                const pageOptions = useMemo(() => {
                    return (myPages || []).map((p) => ({
                        value: p.id,
                        label: `${p.title} (@${p.link})`,
                    }));
                }, [myPages]);

                const queryFilter = {
                    userId: targetUser.id,
                    title: titleFilter.trim() || null,
                    link: linkFilter.trim() || null,
                    status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'user-events',
                        targetUser.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () =>
                        eventService.getEvents({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter,
                                    sort: (tableState.sort as NonNullable<GetEventsQuery>['sort']) ?? 'startedAt:desc',
                                    'include[]': [
                                        'eventDisciplines',
                                        'eventDisciplineDistances',
                                        'eventDisciplineSubDistances',
                                    ],
                                },
                            },
                        }),
                });

                const events = data?.data ?? [];
                const pagination = data?.pagination;

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: ElementStatusEnum }) =>
                        eventService.updateEventStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-events', targetUser.id] });
                        notifications.show({
                            title: t('events'),
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
                    mutationFn: (id: string) =>
                        eventService.deleteEvent({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-events', targetUser.id] });
                        notifications.show({
                            title: t('events'),
                            message: t('eventDeleted'),
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

                const handleOpenEdit = (ev: EventResource) => {
                    setEditingEvent(ev);
                    openFormModal();
                };

                const handleOpenCreate = () => {
                    setEditingEvent(null);
                    openFormModal();
                };

                const handleDelete = (id: string) => {
                    openConfirmActionModal({
                        title: t('confirmDeleteTitle'),
                        message: t('confirmDeleteMessage'),
                        confirmLabel: t('delete'),
                        cancelLabel: t('cancel'),
                        onConfirm: () => deleteMutation.mutate(id),
                    });
                };

                const columns: Column<EventResource>[] = [
                    {
                        key: 'title',
                        header: t('title'),
                        render: (ev) => (
                            <Group gap="sm" wrap="nowrap">
                                <Avatar src={formatImageSrc(ev.photo)} size="md">
                                    ?
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={600} lineClamp={1}>
                                        {ev.title}
                                    </Text>
                                    <Text size="sm" c="dimmed" lineClamp={1}>
                                        {ev.location || '-'}
                                    </Text>
                                </div>
                            </Group>
                        ),
                    },
                    {
                        key: 'startedAt',
                        header: t('startedAt'),
                        render: (ev) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(ev.startedAt)}
                            </Text>
                        ),
                    },
                    {
                        key: 'endedAt',
                        header: t('endedAt'),
                        render: (ev) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(ev.endedAt)}
                            </Text>
                        ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (ev) => <StatusBadge status={ev.status} />,
                    },
                ];

                const filtersNode = (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                        <TextInput
                            label={t('title')}
                            value={titleFilter}
                            onChange={(e) => {
                                setTitleFilter(e.currentTarget.value);
                                tableState.resetPage();
                            }}
                        />
                        <TextInput
                            label={t('link')}
                            value={linkFilter}
                            onChange={(e) => {
                                setLinkFilter(e.currentTarget.value);
                                tableState.resetPage();
                            }}
                        />
                        <Select
                            label={t('status')}
                            placeholder={t('allStatuses')}
                            data={ElementStatusEnum.getOptions(t).map((s) => ({
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
                    <>
                        <DataTable
                            columns={columns}
                            data={events}
                            isLoading={isLoading}
                            state={tableState}
                            totalItems={pagination?.total}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={isOwner ? handleOpenCreate : undefined}
                            actions={(ev) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    <ViewActionButton to={`/events/${ev.link}`} />
                                    {canManage && (
                                        <StatusActionMenu
                                            currentStatus={ev.status}
                                            onStatusChange={(status) =>
                                                statusMutation.mutate({
                                                    id: ev.id,
                                                    status: status as ElementStatusEnum,
                                                })
                                            }
                                            isPending={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && <EditActionButton onClick={() => handleOpenEdit(ev)} />}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => handleDelete(ev.id)}
                                            isPending={deleteMutation.isPending}
                                        />
                                    )}
                                </Group>
                            )}
                        />

                        <EventFormModal
                            opened={formModalOpened}
                            onClose={closeFormModal}
                            event={editingEvent}
                            pageOptions={pageOptions}
                            onSuccess={() => {
                                queryClient.invalidateQueries({
                                    queryKey: ['user-events', targetUser.id],
                                });
                            }}
                        />
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
