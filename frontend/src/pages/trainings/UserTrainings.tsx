import { useState, useMemo } from 'react';
import { Text, SimpleGrid, TextInput, Select, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { trainingService, type TrainingResource, type GetTrainingsQuery } from '../../api/services';
import { useMyFriends } from '../../hooks/useMyFriends';
import { DataTable, type Column } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { buildSortOptions } from '../../utils/tableUtils';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { TrainingFormModal } from '../../components/trainings/TrainingFormModal';

export default function UserTrainings() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState({
        defaultSort: 'startedAt:desc',
    });

    const [titleFilter, setTitleFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingTraining, setEditingTraining] = useState<TrainingResource | null>(null);

    const extraUserIds = useMemo(
        () => editingTraining?.participants?.map((p) => p.userId) ?? [],
        [editingTraining?.participants],
    );
    const { collaboratorOptions } = useMyFriends(extraUserIds);

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
                        queryClient.invalidateQueries({
                            queryKey: ['user-trainings', targetUser.id],
                        });
                        notifications.show({
                            title: t('trainings'),
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
                        trainingService.deleteTraining({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({
                            queryKey: ['user-trainings', targetUser.id],
                        });
                        notifications.show({
                            title: t('trainings'),
                            message: t('trainingDeleted'),
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

                const handleOpenEdit = (tr: TrainingResource) => {
                    setEditingTraining(tr);
                    openFormModal();
                };

                const handleOpenCreate = () => {
                    setEditingTraining(null);
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
                            data={trainings}
                            isLoading={isLoading}
                            state={tableState}
                            totalItems={pagination?.total}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={isOwner ? handleOpenCreate : undefined}
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
                                            onClick={() => handleDelete(tr.id)}
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
                                queryClient.invalidateQueries({
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
