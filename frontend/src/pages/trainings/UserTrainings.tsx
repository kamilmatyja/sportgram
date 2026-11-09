import { useState, useMemo } from 'react';
import { Text, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { trainingService, type TrainingResource, type GetTrainingsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components';
import {
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserSubpageContainer,
    TrainingFormModal,
    TitleLinkStatusFilterGrid,
} from '../../components';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { useDataTableState, useMyFriends, useTitleLinkStatusFilter } from '../../hooks';
import { notifySuccess, notifyError, confirmDelete, formatDateTime, buildSortOptions } from '../../utils';

export default function UserTrainings() {
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
    const [editingTraining, setEditingTraining] = useState<TrainingResource | null>(null);

    const extraUserIds = useMemo(
        () => editingTraining?.participants?.map((p) => p.userId) ?? [],
        [editingTraining?.participants],
    );
    const { collaboratorOptions } = useMyFriends(extraUserIds);

    const sortOptions = buildSortOptions(t, ['startedAt', 'endedAt', 'title', 'location', 'status', 'createdAt']);

    return (
        <UserSubpageContainer requiredRole={RoleEnum.PARTICIPANT}>
            {({ targetUser, isOwner, isAdmin }) => {
                const canManage = isOwner || isAdmin;

                const queryFilter = {
                    userId: targetUser.id,
                    title: titleFilter.trim() || null,
                    link: linkFilter.trim() || null,
                    status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'user-trainings',
                        targetUser.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () =>
                        trainingService.getTrainings({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter,
                                    sort:
                                        (tableState.sort as NonNullable<GetTrainingsQuery>['sort']) ?? 'startedAt:desc',
                                    'include[]': [
                                        'trainingDisciplines',
                                        'trainingDisciplineDistances',
                                        'trainingDisciplineSubDistances',
                                        'trainingParticipants',
                                    ],
                                },
                            },
                        }),
                });

                const trainings = data?.data ?? [];
                const pagination = data?.pagination;

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: ElementStatusEnum }) =>
                        trainingService.updateTrainingStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-trainings', targetUser.id] });
                        notifySuccess(t('statusUpdated'), t('trainings'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) => trainingService.deleteTraining({ params: { path: { id } } }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-trainings', targetUser.id] });
                        notifySuccess(t('deleted'), t('trainings'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const handleOpenEdit = (tr: TrainingResource) => {
                    setEditingTraining(tr);
                    openFormModal();
                };

                const handleOpenCreate = () => {
                    setEditingTraining(null);
                    openFormModal();
                };

                const columns: Column<TrainingResource>[] = [
                    {
                        key: 'title',
                        header: t('title'),
                        render: (tr) => (
                            <div>
                                <Text size="sm" fw={600} lineClamp={1}>
                                    {tr.title}
                                </Text>
                                <Text size="sm" c="dimmed" lineClamp={1}>
                                    {tr.location || '-'}
                                </Text>
                            </div>
                        ),
                    },
                    {
                        key: 'startedAt',
                        header: t('startedAt'),
                        render: (tr) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(tr.startedAt)}
                            </Text>
                        ),
                    },
                    {
                        key: 'endedAt',
                        header: t('endedAt'),
                        render: (tr) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(tr.endedAt)}
                            </Text>
                        ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (tr) => <StatusBadge status={tr.status} />,
                    },
                ];

                const filtersNode = (
                    <TitleLinkStatusFilterGrid
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
                            data={trainings}
                            isLoading={isLoading}
                            state={tableState}
                            totalItems={pagination?.total}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={isOwner ? handleOpenCreate : undefined}
                            addLabel={t('addTraining')}
                            actions={(tr) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    <ViewActionButton to={`/trainings/${tr.link}`} />
                                    {canManage && (
                                        <StatusActionMenu
                                            currentStatus={tr.status}
                                            onStatusChange={(status) =>
                                                statusMutation.mutate({
                                                    id: tr.id,
                                                    status: status as ElementStatusEnum,
                                                })
                                            }
                                            isPending={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && <EditActionButton onClick={() => handleOpenEdit(tr)} />}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => confirmDelete(t, () => deleteMutation.mutate(tr.id))}
                                            isPending={deleteMutation.isPending}
                                        />
                                    )}
                                </Group>
                            )}
                        />

                        <TrainingFormModal
                            opened={formModalOpened}
                            onClose={closeFormModal}
                            training={editingTraining}
                            collaboratorOptions={collaboratorOptions}
                            onSuccess={() => {
                                void queryClient.invalidateQueries({
                                    queryKey: ['user-trainings', targetUser.id],
                                });
                            }}
                        />
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
