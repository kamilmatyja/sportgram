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
    Textarea,
    SimpleGrid,
    TextInput,
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
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { userService, feedService, type FeedCommentResource, type GetFeedCommentsQuery } from '../../api/services';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { truncate } from '../../utils/text';

export default function UserFeedComments() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingComment, setEditingComment] = useState<FeedCommentResource | null>(null);
    const [editText, setEditText] = useState('');
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

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
        { value: 'text:asc', label: t('sort_text_asc') },
        { value: 'text:desc', label: t('sort_text_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
    ];

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (textFilter.trim()) count++;
        if (statusFilter !== null) count++;
        return count;
    }, [textFilter, statusFilter]);

    const handleResetFilters = () => {
        setTextFilter('');
        setStatusFilter(null);
        setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            userId: targetUser?.id ?? null,
            text: textFilter.trim() || null,
            status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
        };
    }, [targetUser?.id, textFilter, statusFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['user-feed-comments', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return feedService.getComments({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetFeedCommentsQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id && canAccessSubpage,
    });

    const comments = data?.data ?? [];
    const pagination = data?.pagination;

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: ElementStatusEnum }) => {
            await feedService.updateCommentStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-feed-comments', targetUser?.id] });
            notifications.show({ title: t('comments'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingComment) return;
            await feedService.updateComment(editingComment.id, { text: editText });
        },
        onSuccess: () => {
            closeEdit();
            setEditingComment(null);
            setEditText('');
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['user-feed-comments', targetUser?.id] });
            notifications.show({ title: t('comments'), message: t('commentUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteComment(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-feed-comments', targetUser?.id] });
            notifications.show({ title: t('comments'), message: t('commentDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEdit = (comment: FeedCommentResource) => {
        setEditingComment(comment);
        setEditText(comment.text);
        setEditFieldErrors({});
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

    const columns: Column<FeedCommentResource>[] = [
        {
            key: 'text',
            header: t('text'),
            render: (c) => (
                <Text size="sm" fw={500} title={c.text}>
                    {truncate(c.text, 60)}
                </Text>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (c) => {
                const opt = ElementStatusEnum.getOptions(t).find((o) => o.value === c.status);
                let color = 'gray';
                if (c.status === ElementStatusEnum.ACTIVE) color = 'green';
                else if (c.status === ElementStatusEnum.REJECTED) color = 'red';
                return (
                    <Badge color={color} variant="light">
                        {opt?.label ?? c.status}
                    </Badge>
                );
            },
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (c) => (
                <Text size="sm" c="dimmed">
                    {formatDateTime(c.createdAt)}
                </Text>
            ),
        },
    ];

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
                label={t('text')}
                placeholder={t('search')}
                value={textFilter}
                onChange={(e) => {
                    setTextFilter(e.currentTarget.value);
                    setPage(1);
                }}
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
                data={comments}
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
                actions={(c) => (
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
                                            disabled={c.status === opt.value || statusMutation.isPending}
                                            onClick={() =>
                                                statusMutation.mutate({
                                                    id: c.id,
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
                                        onClick={() => handleOpenEdit(c)}
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
                                        onClick={() => handleDelete(c.id)}
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

            <Modal opened={editOpened} onClose={closeEdit} title={t('editComment')}>
                <Stack gap="md">
                    <Textarea
                        label={t('text')}
                        value={editText}
                        onChange={(e) => setEditText(e.currentTarget.value)}
                        error={editFieldErrors.text}
                        rows={4}
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
