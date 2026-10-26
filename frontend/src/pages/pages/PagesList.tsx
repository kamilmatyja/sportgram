import { useState } from 'react';
import { Group, Text, Button, Modal, Stack, TextInput, Textarea, Avatar, FileInput, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconBuildingStore } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { pageService, type PageResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import { ColorEnum } from '../../enums/ColorEnum';

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export default function PagesList() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isOrganizer, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    const [opened, { open, close }] = useDisclosure(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        color: '1',
    });
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [bgPhotoFile, setBgPhotoFile] = useState<File | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['pages', page, limit, search],
        queryFn: () =>
            pageService.getPages({
                page,
                limit,
                filter: { title: search || null },
                sort: 'createdAt:desc',
            }),
    });

    const pages = data?.data ?? [];
    const pagination = data?.pagination;

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!profilePhotoFile || !bgPhotoFile) {
                throw new Error(t('photo') + ' ' + t('required'));
            }
            const profilePhoto = await fileToBase64(profilePhotoFile);
            const backgroundPhoto = await fileToBase64(bgPhotoFile);

            await pageService.createPage({
                title: formData.title,
                description: formData.description,
                link: formData.link,
                profilePhoto,
                backgroundPhoto,
                color: (Number(formData.color) as any) || 1,
                userIds: currentUser?.id ? [currentUser.id] : [],
            });
        },
        onSuccess: () => {
            close();
            setFormData({ title: '', description: '', link: '', color: '1' });
            setProfilePhotoFile(null);
            setBgPhotoFile(null);
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            notifications.show({ title: t('pages'), message: t('saved'), color: 'green' });
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
                    <Avatar src={p.profilePhoto || undefined} radius="md" color="blue">
                        <IconBuildingStore size={20} />
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
        profilePhotoFile !== null &&
        bgPhotoFile !== null;

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
                onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                }}
                search={search}
                onSearchChange={(s) => {
                    setSearch(s);
                    setPage(1);
                }}
                searchPlaceholder={t('search')}
                onAdd={isOrganizer || isAdmin ? open : undefined}
                addLabel={t('addPage')}
                actions={(p) => (
                    <Button
                        component={Link}
                        to={`/pages/${p.link}`}
                        variant="light"
                        size="xs"
                        leftSection={<IconEye size={14} />}
                    >
                        {t('details')}
                    </Button>
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addPage')}>
                <Stack gap="sm">
                    <TextInput
                        label={t('title')}
                        required
                        value={formData.title}
                        onChange={(e) => {
                            const title = e.currentTarget.value;
                            const link = title
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setFormData({ ...formData, title, link });
                        }}
                    />
                    <TextInput
                        label={t('link')}
                        required
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                    />
                    <Textarea
                        label={t('description')}
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                    />
                    <Select
                        label={t('color')}
                        required
                        data={ColorEnum.getOptions(t).map((c) => ({ value: String(c.value), label: c.label }))}
                        value={formData.color}
                        onChange={(val) => val && setFormData({ ...formData, color: val })}
                    />
                    <FileInput
                        label={t('profilePhoto')}
                        required
                        accept="image/*"
                        value={profilePhotoFile}
                        onChange={setProfilePhotoFile}
                        clearable
                    />
                    <FileInput
                        label={t('backgroundPhoto')}
                        required
                        accept="image/*"
                        value={bgPhotoFile}
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
        </>
    );
}
