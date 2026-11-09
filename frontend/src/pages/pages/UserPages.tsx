import { useState, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { pageService, type PageResource, type GetPagesQuery } from '../../api/services';
import {
    DataTable,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserSubpageContainer,
    PageFormModal,
    TitleLinkStatusFilterGrid,
    getPageTableColumns,
} from '../../components';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { useDataTableState, useMyFriends, useTitleLinkStatusFilter } from '../../hooks';
import { notifySuccess, notifyError, confirmDelete, buildSortOptions } from '../../utils';
import { Group } from '@mantine/core';

export default function UserPages() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState();

    const {
        titleFilter: title,
        setTitleFilter: setTitle,
        linkFilter,
        setLinkFilter,
        statusFilter,
        setStatusFilter,
        activeFiltersCount,
        handleResetFilters,
    } = useTitleLinkStatusFilter(tableState.resetPage);

    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingPage, setEditingPage] = useState<PageResource | null>(null);

    const extraUserIds = useMemo(
        () => editingPage?.participants?.map((p) => p.userId) ?? [],
        [editingPage?.participants],
    );
    const { collaboratorOptions } = useMyFriends(extraUserIds);

    const sortOptions = buildSortOptions(t, ['createdAt', 'title', 'status']);

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
                        void queryClient.invalidateQueries({ queryKey: ['user-pages', targetUser.id] });
                        notifySuccess(t('statusUpdated'), t('pages'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) => pageService.deletePage({ params: { path: { id } } }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-pages', targetUser.id] });
                        notifySuccess(t('deleted'), t('pages'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const handleOpenEdit = (p: PageResource) => {
                    setEditingPage(p);
                    openFormModal();
                };

                const handleOpenCreate = () => {
                    setEditingPage(null);
                    openFormModal();
                };

                const columns = getPageTableColumns(t);

                const filtersNode = (
                    <TitleLinkStatusFilterGrid
                        title={title}
                        onTitleChange={setTitle}
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
                            data={pages}
                            isLoading={isLoading}
                            state={tableState}
                            totalItems={pagination?.total}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
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
                                            onClick={() => confirmDelete(t, () => deleteMutation.mutate(p.id))}
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
                                void queryClient.invalidateQueries({
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
