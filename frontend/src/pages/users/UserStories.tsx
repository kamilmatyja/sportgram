import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import { StoryViewerModal } from '../../components/StoryViewerModal';
import {
    Stack,
    Text,
    Button,
    ActionIcon,
    Tooltip,
    Modal,
    Textarea,
    FileInput,
    SimpleGrid,
    TextInput,
    Select,
    Avatar,
    Badge,
    Center,
    Loader,
    Group,
    Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconPhoto, IconEdit, IconAdjustments, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { storyService, userService, type StoryResource, type GetStoriesQuery } from '../../api/services';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { UserProfileNav } from '../../components/UserProfileNav';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';

export default function UserStories() {
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
    const [editingStory, setEditingStory] = useState<StoryResource | null>(null);
    const [editText, setEditText] = useState('');
    const [editPhoto, setEditPhoto] = useState<File | null>(null);
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

    const [viewingStory, setViewingStory] = useState<StoryResource | null>(null);

    // Fetch target user
    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: async () => {
            if (!link) return null;
            return await userService.getUserByLink(link);
        },
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

    // Fetch user stories
    const { data, isLoading } = useQuery({
        queryKey: ['user-stories', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: async () => {
            if (!targetUser?.id) return null;
            return await storyService.getStories({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetStoriesQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id && canAccessSubpage,
    });

    const stories = data?.data ?? [];
    const pagination = data?.pagination;

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!photo) throw new Error(t('photo') + ' ' + t('required'));
            const photoStr = await fileToBase64(photo);
            await storyService.createStory({ text, photo: photoStr });
        },
        onSuccess: () => {
            setText('');
            setPhoto(null);
            setFieldErrors({});
            closeCreate();
            queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyAdded'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingStory) return;
            let photoStr = editingStory.photo;
            if (editPhoto) {
                photoStr = await fileToBase64(editPhoto);
            }
            await storyService.updateStory(editingStory.id, {
                text: editText,
                photo: photoStr,
            });
        },
        onSuccess: () => {
            closeEdit();
            setEditingStory(null);
            setEditText('');
            setEditPhoto(null);
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: ElementStatusEnum }) => {
            await storyService.updateStoryStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await storyService.deleteStory(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEdit = (story: StoryResource) => {
        setEditingStory(story);
        setEditText(story.text);
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

    const columns: Column<StoryResource>[] = [
        {
            key: 'photo',
            header: t('photo'),
            render: (s) => (
                <Avatar
                    src={formatImageSrc(s.photo)}
                    radius={5}
                    size="md"
                    className="pointer"
                    onClick={() => setViewingStory(s)}
                >
                    ?
                </Avatar>
            ),
        },
        {
            key: 'text',
            header: t('text'),
            render: (s) => (
                <div>
                    <Text size="sm" lineClamp={2} fw={500}>
                        {s.text}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}
                    </Text>
                </div>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (s) => {
                const opt = ElementStatusEnum.getOptions(t).find((o) => o.value === s.status);
                return (
                    <Badge
                        size="xs"
                        variant="light"
                        color={s.status === ElementStatusEnum.ACTIVE ? 'green' : undefined}
                    >
                        {opt?.label ?? s.status}
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
                data={stories}
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
                addLabel={t('addStory')}
                actions={(s) => (
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('details')} withArrow>
                            <ActionIcon
                                variant="light"
                                size={30}
                                onClick={() => setViewingStory(s)}
                                aria-label={t('details')}
                            >
                                <IconEye size={16} />
                            </ActionIcon>
                        </Tooltip>
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
                                                    id: s.id,
                                                    status: opt.value as ElementStatusEnum,
                                                })
                                            }
                                            disabled={s.status === opt.value}
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
                                    onClick={() => handleOpenEdit(s)}
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
                                    onClick={() => handleDelete(s.id)}
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
            <Modal opened={createOpened} onClose={closeCreate} title={t('addStory')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        placeholder={t('storyDescriptionPlaceholder')}
                        rows={3}
                        value={text}
                        error={fieldErrors.text}
                        onChange={(e) => setText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        accept="image/*"
                        leftSection={<IconPhoto size={16} />}
                        value={photo}
                        error={fieldErrors.photo}
                        onChange={setPhoto}
                        clearable
                        required
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
            <Modal opened={editOpened} onClose={closeEdit} title={t('editStory')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        placeholder={t('storyDescriptionPlaceholder')}
                        rows={3}
                        value={editText}
                        error={editFieldErrors.text}
                        onChange={(e) => setEditText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        description={t('leaveEmptyToKeep')}
                        accept="image/*"
                        leftSection={<IconPhoto size={16} />}
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

            <StoryViewerModal
                opened={!!viewingStory}
                onClose={() => setViewingStory(null)}
                groups={
                    data?.data && targetUser
                        ? [{ userId: targetUser.id, author: targetUser, stories: data.data }]
                        : undefined
                }
                initialStoryIndex={
                    data?.data && viewingStory
                        ? Math.max(
                              0,
                              data.data.findIndex((s) => s.id === viewingStory.id),
                          )
                        : 0
                }
                story={viewingStory}
                author={targetUser}
            />
        </Stack>
    );
}
