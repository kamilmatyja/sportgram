import { useState, useMemo } from 'react';
import { Text, SimpleGrid, TextInput, Select, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { trainingService, type TrainingResource, type GetTrainingsQuery } from '../../api/services';
import { useMyFriends } from '../../hooks/useMyFriends';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { TrainingFormModal } from '../../components/trainings/TrainingFormModal';

export default function UserTrainings() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { page, limit, sort, setPage, onLimitChange, onSortChange, resetPage } = useDataTableState({
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
                    queryKey: ['user-trainings', targetUser.id, page, limit, sort, queryFilter],
                    queryFn: () =>
                        trainingService.getTrainings({
                            params: {
                                query: {
                                    page,
                                    limit,
                                    filter: queryFilter,
                                    sort: (sort as NonNullable<GetTrainingsQuery>['sort']) ?? 'startedAt:desc',
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
                                <Text size="sm" fw={600}>
                                    {tr.title}
                                </Text>
                                <Text size="sm" c="dimmed">
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
                        render: (tr) => <StatusBadge status={tr.status} enumType={ElementStatusEnum} />,
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

                return (
                    <>
                        <DataTable
                            columns={columns}
                            data={trainings}
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
                            onAdd={isOwner ? handleOpenCreate : undefined}
                            addLabel={t('addTraining')}
                            actions={(tr) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    <ViewActionButton to={`/trainings/${tr.link}`} />
                                    {canManage && (
                                        <StatusActionMenu
                                            currentStatus={tr.status}
                                            options={ElementStatusEnum.getOptions(t)}
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
