import { useState, useMemo } from 'react';
import { Group, Text, Avatar, SimpleGrid, TextInput, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { eventService, pageService, type EventResource, type GetEventsQuery } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatImageSrc } from '../../utils/imageUtils';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { EventFormModal } from '../../components/events/EventFormModal';

export default function EventsList() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isOrganizer, isAdmin } = useAuth();

    const { page, limit, sort, setPage, onLimitChange, onSortChange, resetPage } = useDataTableState({
        defaultSort: 'startedAt:desc',
    });

    const [titleFilter, setTitleFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingEvent, setEditingEvent] = useState<EventResource | null>(null);

    const sortOptions: SortOption[] = [
        { value: 'startedAt:desc', label: t('sort_startedAt_desc') },
        { value: 'startedAt:asc', label: t('sort_startedAt_asc') },
        { value: 'endedAt:desc', label: t('sort_endedAt_desc') },
        { value: 'endedAt:asc', label: t('sort_endedAt_asc') },
        { value: 'title:asc', label: t('sort_title_asc') },
        { value: 'title:desc', label: t('sort_title_desc') },
        { value: 'location:asc', label: t('sort_location_asc') },
        { value: 'location:desc', label: t('sort_location_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
    ];

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
        resetPage();
    };

    const queryFilter = useMemo(() => {
        return {
            title: titleFilter.trim() || null,
            link: linkFilter.trim() || null,
            status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
        };
    }, [titleFilter, linkFilter, statusFilter]);

    const { data: myPages } = useQuery({
        queryKey: ['my-pages-for-events-list', currentUser?.id],
        queryFn: async () => {
            if (!currentUser?.id) return [];
            const res = await pageService.getPages({
                params: {
                    query: {
                        filter: { userId: currentUser.id },
                        limit: 50,
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
        for (const p of myPages || []) {
            for (const part of p.participants || []) {
                if (part.userId === currentUser?.id) {
                    set.add(part.id);
                }
            }
        }
        return set;
    }, [myPages, currentUser?.id]);

    const pageOptions = useMemo(() => {
        return (myPages || []).map((p) => ({
            value: p.id,
            label: `${p.title} (@${p.link})`,
        }));
    }, [myPages]);

    const { data, isLoading } = useQuery({
        queryKey: ['events', page, limit, sort, queryFilter],
        queryFn: () =>
            eventService.getEvents({
                params: {
                    query: {
                        page,
                        limit,
                        filter: queryFilter,
                        sort: (sort as NonNullable<GetEventsQuery>['sort']) ?? 'startedAt:desc',
                        'include[]': ['eventDisciplines', 'eventDisciplineDistances', 'eventDisciplineSubDistances'],
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
            queryClient.invalidateQueries({ queryKey: ['events'] });
            notifications.show({ title: t('events'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            eventService.deleteEvent({
                params: { path: { id } },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            notifications.show({ title: t('events'), message: t('eventDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
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
                <Group gap="sm">
                    <Avatar src={formatImageSrc(ev.photo)} radius={5} size="md">
                        ?
                    </Avatar>
                    <div>
                        <Text size="sm" fw={600}>
                            {ev.title}
                        </Text>
                        <Text size="sm" c="dimmed">
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
            render: (ev) => <StatusBadge status={ev.status} enumType={ElementStatusEnum} />,
        },
    ];

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            <TextInput
                label={t('title')}
                value={titleFilter}
                onChange={(e) => {
                    setTitleFilter(e.currentTarget.value);
                    resetPage();
                }}
            />
            <TextInput
                label={t('link')}
                value={linkFilter}
                onChange={(e) => {
                    setLinkFilter(e.currentTarget.value);
                    resetPage();
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
                    resetPage();
                }}
                clearable
            />
        </SimpleGrid>
    );

    const canAddEvent = (isOrganizer || isAdmin) && pageOptions.length > 0;

    return (
        <>
            <DataTable
                columns={columns}
                data={events}
                isLoading={isLoading}
                page={page}
                totalItems={pagination?.total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={onLimitChange}
                sort={sort}
                onSortChange={onSortChange}
                sortOptions={sortOptions}
                filtersNode={filtersNode}
                hasActiveFilters={activeFiltersCount > 0}
                activeFiltersCount={activeFiltersCount}
                onResetFilters={handleResetFilters}
                onAdd={canAddEvent ? handleOpenCreate : undefined}
                addLabel={t('addEvent')}
                actions={(ev) => {
                    const isEventOwner = !!(ev.pageParticipantId && myPageParticipantIds.has(ev.pageParticipantId));
                    const canManageEvent = isEventOwner || isAdmin;

                    return (
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                            <ViewActionButton to={`/events/${ev.link}`} />
                            {canManageEvent && (
                                <StatusActionMenu
                                    currentStatus={ev.status}
                                    options={ElementStatusEnum.getOptions(t)}
                                    onStatusChange={(status) =>
                                        statusMutation.mutate({
                                            id: ev.id,
                                            status: status as ElementStatusEnum,
                                        })
                                    }
                                    isPending={statusMutation.isPending}
                                />
                            )}
                            {isEventOwner && <EditActionButton onClick={() => handleOpenEdit(ev)} />}
                            {isEventOwner && (
                                <DeleteActionButton
                                    onClick={() => handleDelete(ev.id)}
                                    isPending={deleteMutation.isPending}
                                />
                            )}
                        </Group>
                    );
                }}
            />

            <EventFormModal
                opened={formModalOpened}
                onClose={closeFormModal}
                event={editingEvent}
                pageOptions={pageOptions}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['events'] });
                }}
            />
        </>
    );
}
