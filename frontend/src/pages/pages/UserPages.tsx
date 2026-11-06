import { useState, useMemo } from 'react';
import { Group, Text, Avatar, SimpleGrid, TextInput, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { pageService, type PageResource, type GetPagesQuery } from '../../api/services';
import { useMyFriends } from '../../hooks/useMyFriends';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { formatImageSrc } from '../../utils/imageUtils';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { PageFormModal } from '../../components/pages/PageFormModal';

export default function UserPages() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { page, limit, sort, setPage, onLimitChange, onSortChange, resetPage } = useDataTableState({
        defaultSort: 'createdAt:desc',
    });

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

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'title:asc', label: t('sort_title_asc') },
        { value: 'title:desc', label: t('sort_title_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
    ];

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
        resetPage();
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
                    queryKey: ['user-pages', targetUser.id, page, limit, sort, queryFilter],
                    queryFn: () =>
                        pageService.getPages({
                            params: {
                                query: {
                                    page,
                                    limit,
                                    filter: queryFilter,
                                    sort: (sort as NonNullable<GetPagesQuery>['sort']) ?? 'createdAt:desc',
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
                            <Group gap="sm">
                                <Avatar src={formatImageSrc(p.profilePhoto)} radius={5}>
                                    ?
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={600}>
                                        {p.title}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        @{p.link}
                                    </Text>
                                </div>
                            </Group>
                        ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (p) => <StatusBadge status={p.status} enumType={ElementStatusEnum} />,
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
                            data={pages}
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
                            addLabel={t('addPage')}
                            actions={(p) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    <ViewActionButton to={`/pages/${p.link}`} />
                                    {(isOwner || isAdmin) && (
                                        <StatusActionMenu
                                            currentStatus={p.status}
                                            options={ElementStatusEnum.getOptions(t)}
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
