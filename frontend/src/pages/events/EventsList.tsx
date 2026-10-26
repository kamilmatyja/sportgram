import { useState } from 'react';
import {
    Group,
    Text,
    Button,
    Modal,
    Stack,
    TextInput,
    Textarea,
    Badge,
    Select,
    SimpleGrid,
    FileInput,
    ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconCalendarEvent } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { eventService, pageService, type EventResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export default function EventsList() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isOrganizer, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    const [opened, { open, close }] = useDisclosure(false);
    const [selectedPageId, setSelectedPageId] = useState<string>('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        rules: '',
        startedAt: '2026-11-01T10:00',
        endedAt: '2026-11-01T18:00',
        discipline: '1',
        distanceMeters: '5000',
    });

    // Fetch organizer pages for creating an event
    const { data: myPages } = useQuery({
        queryKey: ['my-pages', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const res = await pageService.getPages({
                filter: { userId: currentUser.id },
                limit: 50,
            });
            return res?.data ?? [];
        },
        enabled: !!currentUser && (isOrganizer || isAdmin),
    });

    // Fetch events
    const { data, isLoading } = useQuery({
        queryKey: ['events', page, limit, search],
        queryFn: () =>
            eventService.getEvents({
                page,
                limit,
                filter: { title: search || null },
                sort: 'startedAt:desc',
            }),
    });

    const events = data?.data ?? [];
    const pagination = data?.pagination;

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!selectedPageId) throw new Error(t('selectPage'));
            if (!photoFile) throw new Error(t('photo') + ' ' + t('required'));
            const photoStr = await fileToBase64(photoFile);

            await eventService.createEvent(selectedPageId, {
                title: formData.title,
                description: formData.description,
                link: formData.link,
                location: formData.location,
                rules: formData.rules || formData.description,
                startedAt: formData.startedAt,
                endedAt: formData.endedAt,
                photo: photoStr,
                disciplines: [
                    {
                        discipline: Number(formData.discipline) as any,
                        distances: [
                            {
                                distance: Number(formData.distanceMeters) || 0,
                                subDistances: [],
                            },
                        ],
                    },
                ],
            });
        },
        onSuccess: () => {
            close();
            setPhotoFile(null);
            queryClient.invalidateQueries({ queryKey: ['events'] });
            notifications.show({ title: t('events'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const columns: Column<EventResource>[] = [
        {
            key: 'title',
            header: t('title'),
            render: (ev) => (
                <Group gap="sm">
                    <ThemeIcon variant="light" color="blue" size="md">
                        <IconCalendarEvent size={18} />
                    </ThemeIcon>
                    <div>
                        <Text size="sm" fw={600}>
                            {ev.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {ev.location || '-'}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'disciplines',
            header: t('discipline'),
            render: (ev) => (
                <Group gap={4}>
                    {ev.disciplines?.map((d) => (
                        <Badge key={d.id} size="xs" variant="outline">
                            {DisciplineEnum.getOptions(t).find((o) => o.value === d.discipline)?.label ?? d.discipline}
                        </Badge>
                    ))}
                </Group>
            ),
        },
        {
            key: 'startedAt',
            header: t('startedAt'),
            render: (ev) => <Text size="xs">{ev.startedAt ? new Date(ev.startedAt).toLocaleString() : '-'}</Text>,
        },
    ];

    const canSubmit =
        !!selectedPageId &&
        formData.title.trim().length > 0 &&
        formData.link.trim().length > 0 &&
        formData.location.trim().length > 0 &&
        formData.startedAt.length > 0 &&
        formData.endedAt.length > 0 &&
        formData.description.trim().length > 0 &&
        formData.rules.trim().length > 0 &&
        formData.distanceMeters.trim().length > 0 &&
        photoFile !== null;

    return (
        <>
            <DataTable
                columns={columns}
                data={events}
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
                addLabel={t('addEvent')}
                actions={(ev) => (
                    <Button
                        component={Link}
                        to={`/events/${ev.link}`}
                        variant="light"
                        size="xs"
                        leftSection={<IconEye size={14} />}
                    >
                        {t('details')}
                    </Button>
                )}
            />

            {/* Add Event Modal */}
            <Modal opened={opened} onClose={close} title={t('addEvent')} size="lg">
                <Stack gap="sm">
                    <Select
                        label={t('selectPage')}
                        placeholder={t('selectPage')}
                        required
                        data={myPages?.map((p) => ({ value: p.id, label: p.title })) ?? []}
                        value={selectedPageId}
                        onChange={(val) => val && setSelectedPageId(val)}
                    />

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

                    <TextInput
                        label={t('location')}
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.currentTarget.value })}
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('startedAt')}
                            type="datetime-local"
                            required
                            value={formData.startedAt}
                            onChange={(e) => setFormData({ ...formData, startedAt: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('endedAt')}
                            type="datetime-local"
                            required
                            value={formData.endedAt}
                            onChange={(e) => setFormData({ ...formData, endedAt: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <Select
                            label={t('discipline')}
                            required
                            data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                            value={formData.discipline}
                            onChange={(val) => val && setFormData({ ...formData, discipline: val })}
                        />
                        <TextInput
                            label={t('distanceMeters')}
                            required
                            value={formData.distanceMeters}
                            onChange={(e) => setFormData({ ...formData, distanceMeters: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <FileInput
                        label={t('photo')}
                        required
                        accept="image/*"
                        value={photoFile}
                        onChange={setPhotoFile}
                        clearable
                    />

                    <Textarea
                        label={t('description')}
                        required
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                    />

                    <Textarea
                        label={t('rules')}
                        required
                        rows={2}
                        value={formData.rules}
                        onChange={(e) => setFormData({ ...formData, rules: e.currentTarget.value })}
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
