import { useState, useMemo } from 'react';
import { Group, Text, Avatar, SimpleGrid, TextInput, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { pageService, type PageResource, type GetPagesQuery } from '../../api/services';
import { useMyFriends } from '../../hooks/useMyFriends';
import { DataTable, type Column } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { formatImageSrc } from '../../utils/imageUtils';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { buildSortOptions } from '../../utils/tableUtils';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { PageFormModal } from '../../components/pages/PageFormModal';

export default function UserPages() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState();

    const [title, setTitle] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingPage, setEditingPage] = useState<PageResource | null>(null);

    const extraUserIds = useMemo(
        () => editingPage?.participants?.map((p) => p.userId) ?? [],
        [editingPage?.participants],
    );
    const { collaboratorOptions } = useMyFriends(extraUserIds);

    const sortOptions = buildSortOptions(t, ['createdAt', 'title', 'status']);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (title.trim()) count++;
        if (linkFilter.trim()) count++;
        if (statusFilter !== null) count++;
        return count;
    }, [title, linkFilter, statusFilter]);

    const handleResetFilters = () => {
        setTitle('');
        setLinkFilter('');
        setStatusFilter(null);
        tableState.resetPage();
    };

    return (
        <UserSubpageContainer requiredRole={RoleEnum.ORGANIZER}>
            {({ targetUser, isOwner, isAdmin }) => {
                const queryFilter = {
                    userId: targetUser.id,
                    title: title.trim() || null,
                    link: linkFilter.trim() || null,
                    status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'user-pages',
                        targetUser.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () =>
                        pageService.getPages({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter,
                                    sort: (tableState.sort as NonNullable<GetPagesQuery>['sort']) ?? 'createdAt:desc',
                                    'include[]': ['pageParticipants'],
                                },
                            },
                        }),
                });

                const pages = data?.data ?? [];
                const pagination = data?.pagination;

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: ElementStatusEnum }) =>
                        pageService.updatePageStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-pages', targetUser.id] });
                        notifications.show({
                            title: t('pages'),
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
                        pageService.deletePage({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-pages', targetUser.id] });
                        notifications.show({
                            title: t('pages'),
                            message: t('pageDeleted'),
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

                const handleOpenEdit = (p: PageResource) => {
                    setEditingPage(p);
                    openFormModal();
                };

                const handleOpenCreate = () => {
                    setEditingPage(null);
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

                const columns: Column<PageResource>[] = [
                    {
                        key: 'page',
                        header: t('title'),
                        render: (p) => (
                            <Group gap="sm" wrap="nowrap">
                                <Avatar src={formatImageSrc(p.profilePhoto)}>?</Avatar>
                                <div>
                                    <Text size="sm" fw={600} lineClamp={1}>
                                        {p.title}
                                    </Text>
                                    <Text size="sm" c="dimmed" lineClamp={1}>
                                        @{p.link}
                                    </Text>
                                </div>
                            </Group>
                        ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (p) => <StatusBadge status={p.status} />,
                    },
                    {
                        key: 'createdAt',
                        header: t('createdAt'),
                        render: (p) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(p.createdAt)}
                            </Text>
                        ),
                    },
                ];

                const filtersNode = (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                        <TextInput
                            label={t('title')}
                            value={title}
                            onChange={(e) => {
                                setTitle(e.currentTarget.value);
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
                            data={pages}
                            isLoading={isLoading}
                            state={tableState}
                            totalItems={pagination?.total}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={isOwner ? handleOpenCreate : undefined}
                            actions={(p) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    <ViewActionButton to={`/pages/${p.link}`} />
                                    {(isOwner || isAdmin) && (
                                        <StatusActionMenu
                                            currentStatus={p.status}
                                            onStatusChange={(status) =>
                                                statusMutation.mutate({
                                                    id: p.id,
                                                    status: status as ElementStatusEnum,
                                                })
                                            }
                                            isPending={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && <EditActionButton onClick={() => handleOpenEdit(p)} />}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => handleDelete(p.id)}
                                            isPending={deleteMutation.isPending}
                                        />
                                    )}
                                </Group>
                            )}
                        />

                        <PageFormModal
                            opened={formModalOpened}
                            onClose={closeFormModal}
                            page={editingPage}
                            collaboratorOptions={collaboratorOptions}
                            onSuccess={() => {
                                queryClient.invalidateQueries({
                                    queryKey: ['user-pages', targetUser.id],
                                });
                            }}
                        />
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
