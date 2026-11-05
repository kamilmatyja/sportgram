import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import {
    Text,
    Center,
    Loader,
    Button,
    Stack,
    ActionIcon,
    Tooltip,
    Modal,
    SimpleGrid,
    Select,
    Badge,
    Group,
    Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconEdit, IconAdjustments, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, feedService, type FeedReactionResource, type GetFeedReactionsQuery } from '../../api/services';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';

export default function UserFeedReactions() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    const [reactionFilter, setReactionFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingReaction, setEditingReaction] = useState<FeedReactionResource | null>(null);
    const [editReactionType, setEditReactionType] = useState<number | null>(null);

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const {
        isOwner,
        isAdmin,
        canAccessSubpage,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser,
    });

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'reaction:asc', label: t('sort_text_asc') },
        { value: 'reaction:desc', label: t('sort_text_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
    ];

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (reactionFilter !== null) count++;
        if (statusFilter !== null) count++;
        return count;
    }, [reactionFilter, statusFilter]);

    const handleResetFilters = () => {
        setReactionFilter(null);
        setStatusFilter(null);
        setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            userId: targetUser?.id ?? null,
            reaction: reactionFilter ? (Number(reactionFilter) as FeedReactionEnum) : null,
            status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
        };
    }, [targetUser?.id, reactionFilter, statusFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['user-feed-reactions', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return feedService.getReactions({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetFeedReactionsQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id && canAccessSubpage,
    });

    const reactions = data?.data ?? [];
    const pagination = data?.pagination;

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: ElementStatusEnum }) => {
            await feedService.updateReactionStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-feed-reactions', targetUser?.id] });
            notifications.show({ title: t('reactions'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingReaction || !editReactionType) return;
            await feedService.updateReaction(editingReaction.id, editReactionType as FeedReactionEnum);
        },
        onSuccess: () => {
            closeEdit();
            setEditingReaction(null);
            setEditReactionType(null);
            queryClient.invalidateQueries({ queryKey: ['user-feed-reactions', targetUser?.id] });
            notifications.show({ title: t('reactions'), message: t('reactionUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteReaction(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-feed-reactions', targetUser?.id] });
            notifications.show({ title: t('reactions'), message: t('removeReaction'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEdit = (reaction: FeedReactionResource) => {
        setEditingReaction(reaction);
        setEditReactionType(reaction.reaction);
        openEdit();
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

    const columns: Column<FeedReactionResource>[] = [
        {
            key: 'reaction',
            header: t('reaction'),
            render: (r) => {
                const reactionDef = FeedReactionEnum.ALL_REACTIONS.find((item) => item.type === r.reaction);
                return (
                    <Group gap="xs" wrap="nowrap">
                        <Text size="lg">{reactionDef?.emoji ?? '👍'}</Text>
                        <Text size="sm" fw={500}>
                            {reactionDef ? t(`feedReactions.${reactionDef.key}`) : r.reaction}
                        </Text>
                    </Group>
                );
            },
        },
        {
            key: 'status',
            header: t('status'),
            render: (r) => {
                const opt = ElementStatusEnum.getOptions(t).find((o) => o.value === r.status);
                let color = 'gray';
                if (r.status === ElementStatusEnum.ACTIVE) color = 'green';
                else if (r.status === ElementStatusEnum.REJECTED) color = 'red';
                return (
                    <Badge color={color} variant="light">
                        {opt?.label ?? r.status}
                    </Badge>
                );
            },
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (r) => (
                <Text size="sm" c="dimmed">
                    {formatDateTime(r.createdAt)}
                </Text>
            ),
        },
    ];

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
                label={t('reaction')}
                placeholder={t('selectOption')}
                data={FeedReactionEnum.getOptions(t).map((o) => ({
                    value: String(o.value),
                    label: o.label,
                }))}
                value={reactionFilter}
                onChange={(v) => {
                    setReactionFilter(v);
                    setPage(1);
                }}
                clearable
            />
            <Select
                label={t('status')}
                placeholder={t('allStatuses')}
                data={ElementStatusEnum.getOptions(t).map((s) => ({ value: String(s.value), label: s.label }))}
                value={statusFilter}
                onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                }}
                clearable
            />
        </SimpleGrid>
    );

    if (userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
    }

    if (!canAccessSubpage) {
        return <NotFound title={t('accessDenied')} />;
    }

    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={isOwner} />
            <DataTable
                columns={columns}
                data={reactions}
                isLoading={isLoading}
                page={page}
                totalItems={pagination?.total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                }}
                sort={sort}
                onSortChange={(s) => {
                    setSort(s);
                    setPage(1);
                }}
                sortOptions={sortOptions}
                filtersNode={filtersNode}
                hasActiveFilters={activeFiltersCount > 0}
                activeFiltersCount={activeFiltersCount}
                onResetFilters={handleResetFilters}
                actions={(r) => (
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        {targetUser?.link && (
                            <Tooltip label={t('details')} withArrow>
                                <ActionIcon
                                    component={Link}
                                    to={`/users/${targetUser.link}`}
                                    variant="light"
                                    size={30}
                                    aria-label={t('details')}
                                >
                                    <IconEye size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {(isOwner || isAdmin) && (
                            <Menu shadow="md" width={140} position="bottom-end">
                                <Menu.Target>
                                    <Tooltip label={t('changeStatus')} withArrow>
                                        <ActionIcon
                                            variant="light"
                                            size={30}
                                            aria-label={t('changeStatus')}
                                            loading={statusMutation.isPending}
                                        >
                                            <IconAdjustments size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    {ElementStatusEnum.getOptions(t).map((opt) => (
                                        <Menu.Item
                                            key={opt.value}
                                            disabled={r.status === opt.value || statusMutation.isPending}
                                            onClick={() =>
                                                statusMutation.mutate({
                                                    id: r.id,
                                                    status: opt.value as ElementStatusEnum,
                                                })
                                            }
                                        >
                                            {opt.label}
                                        </Menu.Item>
                                    ))}
                                </Menu.Dropdown>
                            </Menu>
                        )}
                        {isOwner && (
                            <>
                                <Tooltip label={t('edit')} withArrow>
                                    <ActionIcon
                                        variant="light"
                                        size={30}
                                        onClick={() => handleOpenEdit(r)}
                                        aria-label={t('edit')}
                                    >
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={t('delete')} withArrow>
                                    <ActionIcon
                                        variant="light"
                                        color="red"
                                        size={30}
                                        onClick={() => handleDelete(r.id)}
                                        aria-label={t('delete')}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </>
                        )}
                    </Group>
                )}
            />

            <Modal opened={editOpened} onClose={closeEdit} title={t('editReaction')}>
                <Stack gap="md">
                    <Select
                        label={t('reaction')}
                        data={FeedReactionEnum.ALL_REACTIONS.map((item) => ({
                            value: String(item.type),
                            label: `${item.emoji} ${t(`feedReactions.${item.key}`)}`,
                        }))}
                        value={editReactionType ? String(editReactionType) : null}
                        onChange={(v) => setEditReactionType(v ? Number(v) : null)}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeEdit}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
                            {t('save')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
