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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { userService, pageService, friendService, type PageResource, type GetPagesQuery } from '../../api/services';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';

export default function UserPages() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isOrganizer, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [title, setTitle] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [opened, { open, close }] = useDisclosure(false);
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

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
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

    const isOwner = currentUser?.id === targetUser?.id;
    const canManage = isOwner || isAdmin;

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
        enabled: !!targetUser?.id,
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
            close();
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

    const columns: Column<PageResource>[] = [
        {
            key: 'page',
            header: t('title'),
            render: (p) => (
                <Group gap="sm">
                    <Avatar src={formatImageSrc(p.profilePhoto)} radius="md">
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
            key: 'createdAt',
            header: t('createdAt'),
            render: (p) => (
                <Text size="xs" c="dimmed">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                </Text>
            ),
        },
    ];

    const canSubmit =
        formData.title.trim().length > 0 &&
        formData.link.trim().length > 0 &&
        formData.description.trim().length > 0 &&
        formData.color !== null &&
        profilePhotoFile !== null &&
        bgPhotoFile !== null;

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            <TextInput
                label={t('title')}
                placeholder={t('title')}
                value={title}
                onChange={(e) => {
                    setTitle(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('link')}
                placeholder={t('link')}
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

    if (userLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
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
                onAdd={(isOwner && isOrganizer) || isAdmin ? open : undefined}
                addLabel={t('addPage')}
                actions={(p) => (
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('details')} withArrow>
                            <ActionIcon
                                component={Link}
                                to={`/pages/${p.link}`}
                                variant="light"
                                color="blue"
                                size={30}
                                aria-label={t('details')}
                            >
                                <IconEye size={16} />
                            </ActionIcon>
                        </Tooltip>
                        {canManage && (
                            <Tooltip label={t('delete')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size={30}
                                    onClick={() => deleteMutation.mutate(p.id)}
                                    aria-label={t('delete')}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addPage')} size="lg">
                <Stack gap="sm">
                    <TextInput
                        label={t('title')}
                        placeholder={t('title')}
                        required
                        value={formData.title}
                        error={fieldErrors.title}
                        onChange={(e) => {
                            const val = e.currentTarget.value;
                            const generatedLink = val
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setFormData({ ...formData, title: val, link: generatedLink });
                        }}
                    />
                    <TextInput
                        label={t('link')}
                        placeholder={t('link')}
                        required
                        value={formData.link}
                        error={fieldErrors.link}
                        onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                    />
                    <Textarea
                        label={t('description')}
                        placeholder={t('description')}
                        required
                        rows={3}
                        value={formData.description}
                        error={fieldErrors.description}
                        onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                    />
                    <Select
                        label={t('color')}
                        placeholder={t('color')}
                        required
                        clearable
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
                    <FileInput
                        label={t('profilePhoto')}
                        placeholder={t('selectPhotoPlaceholder')}
                        required
                        accept="image/*"
                        value={profilePhotoFile}
                        error={fieldErrors.profilePhoto}
                        onChange={setProfilePhotoFile}
                        clearable
                    />
                    <FileInput
                        label={t('backgroundPhoto')}
                        placeholder={t('selectPhotoPlaceholder')}
                        required
                        accept="image/*"
                        value={bgPhotoFile}
                        error={fieldErrors.backgroundPhoto}
                        onChange={setBgPhotoFile}
                        clearable
                    />
                    <Button
                        mt="md"
                        loading={createMutation.isPending}
                        disabled={!canSubmit}
                        onClick={() => createMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
