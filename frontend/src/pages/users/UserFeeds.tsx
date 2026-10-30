import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import {
    Text,
    Center,
    Loader,
    Button,
    Stack,
    Avatar,
    ActionIcon,
    Tooltip,
    Modal,
    Textarea,
    FileInput,
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
import { userService, feedService, type FeedResource, type GetFeedsQuery } from '../../api/services';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';

export default function UserFeeds() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Create modal
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [text, setText] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Edit modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingFeed, setEditingFeed] = useState<FeedResource | null>(null);
    const [editText, setEditText] = useState('');
    const [editPhoto, setEditPhoto] = useState<File | null>(null);
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
        queryKey: ['user-feeds', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return feedService.getFeeds({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetFeedsQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id && canAccessSubpage,
    });

    const feeds = data?.data ?? [];
    const pagination = data?.pagination;

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!photo) {
                throw new Error(t('photo') + ' ' + t('required'));
            }
            const photoStr = await fileToBase64(photo);
            await feedService.createFeed({ text, photo: photoStr });
        },
        onSuccess: () => {
            setText('');
            setPhoto(null);
            setFieldErrors({});
            closeCreate();
            queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedAdded'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingFeed) return;
            let photoStr = editingFeed.photo;
            if (editPhoto) {
                photoStr = await fileToBase64(editPhoto);
            }
            await feedService.updateFeed(editingFeed.id, {
                text: editText,
                photo: photoStr ?? '',
            });
        },
        onSuccess: () => {
            closeEdit();
            setEditingFeed(null);
            setEditText('');
            setEditPhoto(null);
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: ElementStatusEnum }) => {
            await feedService.updateFeedStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => feedService.deleteFeed(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEdit = (feed: FeedResource) => {
        setEditingFeed(feed);
        setEditText(feed.text ?? '');
        setEditPhoto(null);
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

    const columns: Column<FeedResource>[] = [
        {
            key: 'photo',
            header: t('photo'),
            render: (f) => (
                <Avatar src={formatImageSrc(f.photo)} radius="sm" size="md">
                    ?
                </Avatar>
            ),
        },
        {
            key: 'text',
            header: t('text'),
            render: (f) => (
                <div>
                    <Text size="sm" lineClamp={2} fw={500}>
                        {f.text}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}
                    </Text>
                </div>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (f) => {
                const opt = ElementStatusEnum.getOptions(t).find((o) => o.value === f.status);
                return (
                    <Badge
                        size="xs"
                        variant="light"
                        color={f.status === ElementStatusEnum.ACTIVE ? 'green' : undefined}
                    >
                        {opt?.label ?? f.status}
                    </Badge>
                );
            },
        },
    ];

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
                label={t('text')}
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
                data={feeds}
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
                onAdd={isOwner ? openCreate : undefined}
                addLabel={t('addFeed')}
                actions={(f) => (
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
                                            onClick={() =>
                                                statusMutation.mutate({
                                                    id: f.id,
                                                    status: opt.value as ElementStatusEnum,
                                                })
                                            }
                                            disabled={f.status === opt.value}
                                        >
                                            {opt.label}
                                        </Menu.Item>
                                    ))}
                                </Menu.Dropdown>
                            </Menu>
                        )}
                        {isOwner && (
                            <Tooltip label={t('edit')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    size={30}
                                    onClick={() => handleOpenEdit(f)}
                                    aria-label={t('edit')}
                                >
                                    <IconEdit size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {(isOwner || isAdmin) && (
                            <Tooltip label={t('delete')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size={30}
                                    onClick={() => handleDelete(f.id)}
                                    loading={deleteMutation.isPending}
                                    disabled={deleteMutation.isPending}
                                    aria-label={t('delete')}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                )}
            />

            {/* Create modal */}
            <Modal opened={createOpened} onClose={closeCreate} title={t('addFeed')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        required
                        label={t('description')}
                        placeholder={t('feedTextPlaceholder')}
                        rows={3}
                        value={text}
                        error={fieldErrors.text}
                        onChange={(e) => setText(e.currentTarget.value)}
                    />
                    <FileInput
                        required
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        accept="image/*"
                        value={photo}
                        error={fieldErrors.photo}
                        onChange={setPhoto}
                        clearable
                    />
                    <Button
                        loading={createMutation.isPending}
                        disabled={createMutation.isPending || !text.trim() || !photo}
                        onClick={() => createMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            {/* Edit modal */}
            <Modal opened={editOpened} onClose={closeEdit} title={t('editFeed')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        required
                        label={t('description')}
                        placeholder={t('feedTextPlaceholder')}
                        rows={3}
                        value={editText}
                        error={editFieldErrors.text}
                        onChange={(e) => setEditText(e.currentTarget.value)}
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        description={t('leaveEmptyToKeep')}
                        accept="image/*"
                        value={editPhoto}
                        error={editFieldErrors.photo}
                        onChange={setEditPhoto}
                        clearable
                    />
                    <Button
                        loading={updateMutation.isPending}
                        disabled={updateMutation.isPending || !editText.trim()}
                        onClick={() => updateMutation.mutate()}
                    >
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
