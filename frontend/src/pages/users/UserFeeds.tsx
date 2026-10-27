import { useState, useMemo } from 'react';
import {
    Text,
    Button,
    Stack,
    Avatar,
    ActionIcon,
    Modal,
    Textarea,
    FileInput,
    SimpleGrid,
    TextInput,
    Select,
    Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, feedService, type FeedResource, type GetFeedsQuery } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';

export default function UserFeeds() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [opened, { open, close }] = useDisclosure(false);
    const [text, setText] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);

    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const isOwner = currentUser?.id === targetUser?.id;

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
        enabled: !!targetUser?.id,
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
            close();
            queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', targetUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('saved'), color: 'green' });
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
            notifications.show({ title: t('feeds'), message: t('deleted'), color: 'blue' });
        },
    });

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
                    <Badge size="xs" variant="light" color={f.status === ElementStatusEnum.ACTIVE ? 'green' : 'blue'}>
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
                placeholder={t('text')}
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

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} isOwner={isOwner} />}
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
                onAdd={isOwner || isAdmin ? open : undefined}
                addLabel={t('addFeed')}
                actions={(f) =>
                    isOwner || isAdmin ? (
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => deleteMutation.mutate(f.id)}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    ) : null
                }
            />

            <Modal opened={opened} onClose={close} title={t('addFeed')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        required
                        label={t('description')}
                        placeholder={t('feedTextPlaceholder')}
                        rows={3}
                        value={text}
                        onChange={(e) => setText(e.currentTarget.value)}
                    />
                    <FileInput
                        required
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        accept="image/*"
                        value={photo}
                        onChange={setPhoto}
                        clearable
                    />
                    <Button
                        loading={createMutation.isPending}
                        disabled={!text.trim() || !photo}
                        onClick={() => createMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
