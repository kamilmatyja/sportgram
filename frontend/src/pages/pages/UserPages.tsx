import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import {
    Group,
    Text,
    Button,
    Avatar,
    Stack,
    SimpleGrid,
    TextInput,
    Select,
    MultiSelect,
    ActionIcon,
    Modal,
    Textarea,
    FileInput,
    Center,
    Loader,
    Tooltip,
    Menu,
    Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconTrash, IconEdit, IconAdjustments } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { userService, pageService, friendService, type PageResource, type GetPagesQuery } from '../../api/services';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';
import { openConfirmActionModal } from '../../utils/confirmModal';

export default function UserPages() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [title, setTitle] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Create modal
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        color: null as string | null,
    });
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [bgPhotoFile, setBgPhotoFile] = useState<File | null>(null);
    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Edit modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingPage, setEditingPage] = useState<PageResource | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        link: '',
        color: null as string | null,
    });
    const [editCollaboratorIds, setEditCollaboratorIds] = useState<string[]>([]);
    const [editProfilePhotoFile, setEditProfilePhotoFile] = useState<File | null>(null);
    const [editBgPhotoFile, setEditBgPhotoFile] = useState<File | null>(null);
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
        hasRequiredRole,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser,
        requiredRole: RoleEnum.ORGANIZER,
    });

    const { data: myFriendsData } = useQuery({
        queryKey: ['my-accepted-friends', currentUser?.id],
        queryFn: async () => {
            if (!currentUser?.id) return [];
            const res = await friendService.getFriends({
                limit: 100,
                filter: { userIds: [currentUser.id], status: FriendStatusEnum.ACCEPTED },
            });
            const friendsList = res.data ?? [];
            const otherIds = friendsList.map((f) =>
                f.senderUserId === currentUser.id ? f.receiverUserId : f.senderUserId,
            );
            if (otherIds.length === 0) return [];
            return await userService.getUsersByIds(otherIds);
        },
        enabled: !!currentUser?.id,
    });

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
        setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            userId: targetUser?.id ?? null,
            title: title.trim() || null,
            link: linkFilter.trim() || null,
            status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
        };
    }, [targetUser?.id, title, linkFilter, statusFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['user-pages', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return pageService.getPages({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetPagesQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id && canAccessSubpage && hasRequiredRole,
    });

    const pages = data?.data ?? [];
    const pagination = data?.pagination;

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!profilePhotoFile || !bgPhotoFile) {
                throw new Error(t('photo') + ' ' + t('required'));
            }
            if (!formData.color) {
                throw new Error(t('color') + ' ' + t('required'));
            }
            const profilePhoto = await fileToBase64(profilePhotoFile);
            const backgroundPhoto = await fileToBase64(bgPhotoFile);

            await pageService.createPage({
                title: formData.title,
                description: formData.description,
                link: formData.link,
                profilePhoto,
                backgroundPhoto,
                color: Number(formData.color) as ColorEnum,
                userIds: currentUser?.id ? Array.from(new Set([currentUser.id, ...collaboratorIds])) : [],
            });
        },
        onSuccess: () => {
            closeCreate();
            setFormData({ title: '', description: '', link: '', color: null });
            setProfilePhotoFile(null);
            setBgPhotoFile(null);
            setCollaboratorIds([]);
            setFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['user-pages', targetUser?.id] });
            notifications.show({ title: t('pages'), message: t('pageCreated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingPage || !editFormData.color) return;
            let profilePhoto = editingPage.profilePhoto;
            if (editProfilePhotoFile) {
                profilePhoto = await fileToBase64(editProfilePhotoFile);
            }
            let backgroundPhoto = editingPage.backgroundPhoto;
            if (editBgPhotoFile) {
                backgroundPhoto = await fileToBase64(editBgPhotoFile);
            }

            await pageService.updatePage(editingPage.id, {
                title: editFormData.title,
                description: editFormData.description,
                link: editFormData.link,
                color: Number(editFormData.color) as ColorEnum,
                profilePhoto,
                backgroundPhoto,
                userIds: currentUser?.id
                    ? Array.from(new Set([currentUser.id, ...editCollaboratorIds]))
                    : editCollaboratorIds,
            });
        },
        onSuccess: () => {
            closeEdit();
            setEditingPage(null);
            setEditCollaboratorIds([]);
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['user-pages', targetUser?.id] });
            notifications.show({ title: t('pages'), message: t('pageUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ElementStatusEnum }) =>
            pageService.updatePageStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-pages', targetUser?.id] });
            notifications.show({ title: t('pages'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => pageService.deletePage(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-pages', targetUser?.id] });
            notifications.show({ title: t('pages'), message: t('pageDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEdit = (p: PageResource) => {
        setEditingPage(p);
        setEditFormData({
            title: p.title,
            description: p.description ?? '',
            link: p.link,
            color: String(p.color),
        });
        const otherParticipantIds = (p.participants ?? [])
            .map((part) => part.userId)
            .filter((uid) => uid !== currentUser?.id);
        setEditCollaboratorIds(otherParticipantIds);
        setEditProfilePhotoFile(null);
        setEditBgPhotoFile(null);
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
                        <Text size="xs" c="dimmed">
                            @{p.link}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'description',
            header: t('description'),
            render: (p) => (
                <Text size="xs" lineClamp={2} c="dimmed">
                    {p.description || '-'}
                </Text>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (p) => {
                const opt = ElementStatusEnum.getOptions(t).find((o) => o.value === p.status);
                const color =
                    p.status === ElementStatusEnum.ACTIVE
                        ? 'green'
                        : p.status === ElementStatusEnum.REJECTED
                          ? 'red'
                          : 'gray';
                return (
                    <Badge color={color} variant="light">
                        {opt?.label ?? p.status}
                    </Badge>
                );
            },
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (p) => <Text size="xs">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</Text>,
        },
    ];

    const canSubmit =
        formData.title.trim().length > 0 &&
        formData.link.trim().length > 0 &&
        formData.color !== null &&
        profilePhotoFile !== null &&
        bgPhotoFile !== null;

    const canSubmitEdit =
        editFormData.title.trim().length > 0 && editFormData.link.trim().length > 0 && editFormData.color !== null;

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            <TextInput
                label={t('title')}
                value={title}
                onChange={(e) => {
                    setTitle(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('link')}
                value={linkFilter}
                onChange={(e) => {
                    setLinkFilter(e.currentTarget.value);
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

    if (!canAccessSubpage || !hasRequiredRole) {
        return <NotFound title={t('accessDenied')} />;
    }

    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={isOwner} />
            <DataTable
                columns={columns}
                data={pages}
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
                addLabel={t('addPage')}
                actions={(p) => (
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('details')} withArrow>
                            <ActionIcon
                                component={Link}
                                to={`/pages/${p.link}`}
                                variant="light"
                                size={30}
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
                                                    id: p.id,
                                                    status: opt.value as ElementStatusEnum,
                                                })
                                            }
                                            disabled={p.status === opt.value}
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
                                    onClick={() => handleOpenEdit(p)}
                                    aria-label={t('edit')}
                                >
                                    <IconEdit size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {isOwner && (
                            <Tooltip label={t('delete')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size={30}
                                    onClick={() => handleDelete(p.id)}
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
            <Modal opened={createOpened} onClose={closeCreate} title={t('addPage')} size="lg">
                <Stack gap="sm">
                    <TextInput
                        label={t('title')}
                        required
                        value={formData.title}
                        error={fieldErrors.title}
                        onChange={(e) => {
                            const text = e.currentTarget.value;
                            const link = text
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setFormData({ ...formData, title: text, link });
                        }}
                    />
                    <TextInput
                        label={t('link')}
                        required
                        value={formData.link}
                        error={fieldErrors.link}
                        onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                    />
                    <Textarea
                        label={t('description')}
                        value={formData.description}
                        error={fieldErrors.description}
                        onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                        rows={3}
                    />
                    <Select
                        label={t('color')}
                        placeholder={t('color')}
                        required
                        data={ColorEnum.getOptions(t).map((c) => ({ value: String(c.value), label: c.label }))}
                        value={formData.color}
                        error={fieldErrors.color}
                        onChange={(val) => setFormData({ ...formData, color: val })}
                    />
                    <MultiSelect
                        label={t('collaborators')}
                        placeholder={t('selectCollaborators')}
                        data={
                            myFriendsData?.map((u) => ({
                                value: u.id,
                                label: `${u.firstName} ${u.lastName} (@${u.link})`,
                            })) ?? []
                        }
                        value={collaboratorIds}
                        onChange={setCollaboratorIds}
                        searchable
                        clearable
                    />
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <FileInput
                            label={t('profilePhoto')}
                            placeholder={t('selectPhotoPlaceholder')}
                            accept="image/*"
                            value={profilePhotoFile}
                            error={fieldErrors.profilePhoto}
                            onChange={setProfilePhotoFile}
                            required
                        />
                        <FileInput
                            label={t('backgroundPhoto')}
                            placeholder={t('selectPhotoPlaceholder')}
                            accept="image/*"
                            value={bgPhotoFile}
                            error={fieldErrors.backgroundPhoto}
                            onChange={setBgPhotoFile}
                            required
                        />
                    </SimpleGrid>
                    <Button
                        mt="md"
                        loading={createMutation.isPending}
                        disabled={createMutation.isPending || !canSubmit}
                        onClick={() => createMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            {/* Edit modal */}
            <Modal opened={editOpened} onClose={closeEdit} title={t('editPage')} size="lg">
                <Stack gap="sm">
                    <TextInput
                        label={t('title')}
                        required
                        value={editFormData.title}
                        error={editFieldErrors.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.currentTarget.value })}
                    />
                    <TextInput
                        label={t('link')}
                        required
                        value={editFormData.link}
                        error={editFieldErrors.link}
                        onChange={(e) => setEditFormData({ ...editFormData, link: e.currentTarget.value })}
                    />
                    <Textarea
                        label={t('description')}
                        value={editFormData.description}
                        error={editFieldErrors.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.currentTarget.value })}
                        rows={3}
                    />
                    <Select
                        label={t('color')}
                        placeholder={t('color')}
                        required
                        data={ColorEnum.getOptions(t).map((c) => ({ value: String(c.value), label: c.label }))}
                        value={editFormData.color}
                        error={editFieldErrors.color}
                        onChange={(val) => setEditFormData({ ...editFormData, color: val })}
                    />
                    <MultiSelect
                        label={t('collaborators')}
                        placeholder={t('selectCollaborators')}
                        data={
                            myFriendsData?.map((u) => ({
                                value: u.id,
                                label: `${u.firstName} ${u.lastName} (@${u.link})`,
                            })) ?? []
                        }
                        value={editCollaboratorIds}
                        onChange={setEditCollaboratorIds}
                        searchable
                        clearable
                    />
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <FileInput
                            label={t('profilePhoto')}
                            placeholder={t('selectPhotoPlaceholder')}
                            description={t('leaveEmptyToKeep')}
                            accept="image/*"
                            value={editProfilePhotoFile}
                            error={editFieldErrors.profilePhoto}
                            onChange={setEditProfilePhotoFile}
                            clearable
                        />
                        <FileInput
                            label={t('backgroundPhoto')}
                            placeholder={t('selectPhotoPlaceholder')}
                            description={t('leaveEmptyToKeep')}
                            accept="image/*"
                            value={editBgPhotoFile}
                            error={editFieldErrors.backgroundPhoto}
                            onChange={setEditBgPhotoFile}
                            clearable
                        />
                    </SimpleGrid>
                    <Button
                        mt="md"
                        loading={updateMutation.isPending}
                        disabled={updateMutation.isPending || !canSubmitEdit}
                        onClick={() => updateMutation.mutate()}
                    >
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
