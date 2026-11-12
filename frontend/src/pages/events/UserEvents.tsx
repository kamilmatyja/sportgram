import { useState, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { eventService, pageService, type EventResource, type GetEventsQuery } from '../../api/services';
import {
    DataTable,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserSubpageContainer,
    EventFormModal,
    TitleLinkStatusFilter,
    getEventTableColumns,
} from '../../components';
import type { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { useDataTableState, useTitleLinkStatusFilter } from '../../hooks';
import { notifySuccess, notifyError, confirmDelete, buildSortOptions } from '../../utils';
import { Group } from '@mantine/core';

export default function UserEvents() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

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
    } = useTitleLinkStatusFilter(tableState.resetPage);

    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingEvent, setEditingEvent] = useState<EventResource | null>(null);

    const sortOptions = buildSortOptions(t, ['startedAt', 'endedAt', 'title', 'location', 'status', 'createdAt']);

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

                const pageOptions = useMemo(
                    () => (myPages || []).map((p) => ({ value: p.id, label: `${p.title} (@${p.link})` })),
                    [myPages],
                );

                const queryFilter = {
                    userId: targetUser.id,
                    title: titleFilter.trim() || null,
                    link: linkFilter.trim() || null,
                    status: statusFilter ? Number(statusFilter) : null,
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
                                    filter: queryFilter as NonNullable<GetEventsQuery>['filter'],
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
                        void queryClient.invalidateQueries({ queryKey: ['user-events', targetUser.id] });
                        notifySuccess(t('statusUpdated'), t('events'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) => eventService.deleteEvent({ params: { path: { id } } }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-events', targetUser.id] });
                        notifySuccess(t('deleted'), t('events'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const handleOpenEdit = (ev: EventResource) => {
                    setEditingEvent(ev);
                    openFormModal();
                };

                const handleOpenCreate = () => {
                    setEditingEvent(null);
                    openFormModal();
                };

                const columns = getEventTableColumns(t);

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
                            addLabel={t('addEvent')}
                            actions={(ev) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    <ViewActionButton to={`/events/${ev.link}`} />
                                    {canManage && (
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
                                    {isOwner && <EditActionButton onClick={() => handleOpenEdit(ev)} />}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => confirmDelete(t, () => deleteMutation.mutate(ev.id))}
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
                                void queryClient.invalidateQueries({
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
