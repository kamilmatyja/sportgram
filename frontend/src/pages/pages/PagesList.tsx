import { useState, useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { pageService, type PageResource, type GetPagesQuery } from '../../api/services';
import { useAuth } from '../../auth';
import {
    DataTable,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    PageFormModal,
    TitleLinkStatusFilterGrid,
    getPageTableColumns,
} from '../../components';
import { useDataTableState, useMyFriends, useTitleLinkStatusFilter } from '../../hooks';
import { notifySuccess, notifyError, confirmDelete, buildSortOptions } from '../../utils';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum.ts';
import { Group } from '@mantine/core';

export default function PagesList() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isOrganizer, isAdmin } = useAuth();

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
        queryFilter,
    } = useTitleLinkStatusFilter(tableState.resetPage);

    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingPage, setEditingPage] = useState<PageResource | null>(null);

    const sortOptions = buildSortOptions(t, ['createdAt', 'title', 'status']);

    const extraUserIds = useMemo(
        () => editingPage?.participants?.map((p) => p.userId) ?? [],
        [editingPage?.participants],
    );
    const { collaboratorOptions } = useMyFriends(extraUserIds);

    const { data, isLoading } = useQuery({
        queryKey: ['pages', tableState.page, tableState.limit, tableState.sort, queryFilter],
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
            void queryClient.invalidateQueries({ queryKey: ['pages'] });
            notifySuccess(t('statusUpdated'), t('pages'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => pageService.deletePage({ params: { path: { id } } }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['pages'] });
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

    const columns = useMemo(() => getPageTableColumns(t), [t]);

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
                onAdd={isOrganizer || isAdmin ? handleOpenCreate : undefined}
                addLabel={t('addPage')}
                actions={(p) => {
                    const isPageOwner = currentUser?.id === p.userId;
                    const canManagePage = isPageOwner || isAdmin;

                    return (
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                            <ViewActionButton to={`/pages/${p.link}`} />
                            {canManagePage && (
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
                            {isPageOwner && <EditActionButton onClick={() => handleOpenEdit(p)} />}
                            {isPageOwner && (
                                <DeleteActionButton
                                    onClick={() => confirmDelete(t, () => deleteMutation.mutate(p.id))}
                                    isPending={deleteMutation.isPending}
                                />
                            )}
                        </Group>
                    );
                }}
            />

            <PageFormModal
                opened={formModalOpened}
                onClose={closeFormModal}
                page={editingPage}
                collaboratorOptions={collaboratorOptions}
                onSuccess={() => {
                    void queryClient.invalidateQueries({ queryKey: ['pages'] });
                }}
            />
        </>
    );
}
