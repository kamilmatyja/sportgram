import { useState, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { eventService, pageService, type EventResource, type GetEventsQuery } from '../../api/services';
import { useAuth } from '../../auth';
import {
    DataTable,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    EventFormModal,
    TitleLinkStatusFilter,
    getEventTableColumns,
} from '../../components';
import { useDataTableState, useTitleLinkStatusFilter } from '../../hooks';
import { notifySuccess, notifyError, confirmDelete, buildSortOptions } from '../../utils';
import { Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { ElementStatusEnum } from '../../enums/ElementStatusEnum';

export default function EventsList() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isOrganizer, isAdmin } = useAuth();

    const tableState = useDataTableState({ defaultSort: 'startedAt:desc' });

    const {
        titleFilter,
        setTitleFilter,
        linkFilter,
        setLinkFilter,
        statusFilter,
        setStatusFilter,
        activeFiltersCount,
        handleResetFilters,
        queryFilter,
    } = useTitleLinkStatusFilter(tableState.resetPage);

    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingEvent, setEditingEvent] = useState<EventResource | null>(null);

    const sortOptions = buildSortOptions(t, ['startedAt', 'endedAt', 'title', 'location', 'status', 'createdAt']);

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

    const pageOptions = useMemo(
        () => (myPages || []).map((p) => ({ value: p.id, label: `${p.title} (@${p.link})` })),
        [myPages],
    );

    const { data, isLoading } = useQuery({
        queryKey: ['events', tableState.page, tableState.limit, tableState.sort, queryFilter],
        queryFn: () =>
            eventService.getEvents({
                params: {
                    query: {
                        page: tableState.page,
                        limit: tableState.limit,
                        filter: queryFilter as NonNullable<GetEventsQuery>['filter'],
                        sort: (tableState.sort as NonNullable<GetEventsQuery>['sort']) ?? 'startedAt:desc',
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
            void queryClient.invalidateQueries({ queryKey: ['events'] });
            notifySuccess(t('statusUpdated'), t('events'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => eventService.deleteEvent({ params: { path: { id } } }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['events'] });
            notifySuccess(t('deleted'), t('events'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const handleOpenEdit = (ev: EventResource) => {
        setEditingEvent(ev);
        openFormModal();
    };

    const handleOpenCreate = () => {
        if (pageOptions.length === 0) {
            notifications.show({
                title: t('events'),
                message: t('noPagesFound'),
                color: 'yellow',
            });
            return;
        }
        setEditingEvent(null);
        openFormModal();
    };

    const columns = useMemo(() => getEventTableColumns(t), [t]);

    const filtersNode = (
        <TitleLinkStatusFilter
            title={titleFilter}
            onTitleChange={setTitleFilter}
            link={linkFilter}
            onLinkChange={setLinkFilter}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            onFilterChange={tableState.resetPage}
        />
    );

    const canAddEvent = isOrganizer || isAdmin;

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
                                    onStatusChange={(status) =>
                                        statusMutation.mutate({
                                            id: ev.id,
                                            status: status,
                                        })
                                    }
                                    isPending={statusMutation.isPending}
                                />
                            )}
                            {isEventOwner && <EditActionButton onClick={() => handleOpenEdit(ev)} />}
                            {isEventOwner && (
                                <DeleteActionButton
                                    onClick={() => confirmDelete(t, () => deleteMutation.mutate(ev.id))}
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
                    void queryClient.invalidateQueries({ queryKey: ['events'] });
                }}
            />
        </>
    );
}
