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
    ActionIcon,
    ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconRun, IconCurrentLocation } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, trainingService, type TrainingResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export default function UserTrainings() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isParticipant, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    const [opened, { open, close }] = useDisclosure(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        discipline: '1',
        distance: '5000',
        time: '1800',
        startedAt: '2026-10-26T18:00',
        endedAt: '2026-10-26T18:30',
    });

    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const isOwner = currentUser?.id === targetUser?.id;

    const { data, isLoading } = useQuery({
        queryKey: ['trainings', targetUser?.id, page, limit, search],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return trainingService.getTrainings({
                page,
                limit,
                filter: { userId: targetUser.id, title: search || null },
                sort: 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id,
    });

    const trainings = data?.data ?? [];
    const pagination = data?.pagination;

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            notifications.show({ title: t('location'), message: t('error'), color: 'red' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
                setFormData((prev) => ({ ...prev, location: coords }));
                notifications.show({ title: t('location'), message: coords, color: 'green' });
            },
            (err) => {
                notifications.show({ title: t('location'), message: err.message, color: 'red' });
            },
        );
    };

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!currentUser?.id) return;
            await trainingService.createTraining({
                title: formData.title,
                description: formData.description,
                link: formData.link,
                location: formData.location,
                startedAt: formData.startedAt,
                endedAt: formData.endedAt,
                userIds: [currentUser.id],
                disciplines: [
                    {
                        discipline: Number(formData.discipline) as any,
                        distances: [
                            {
                                distance: Number(formData.distance) || 0,
                                time: Number(formData.time) || 0,
                                subDistances: [],
                            },
                        ],
                    },
                ],
            });
        },
        onSuccess: () => {
            close();
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
            notifications.show({ title: t('trainings'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const columns: Column<TrainingResource>[] = [
        {
            key: 'title',
            header: t('title'),
            render: (tr) => (
                <Group gap="sm">
                    <ThemeIcon variant="light" color="blue" size="md">
                        <IconRun size={18} />
                    </ThemeIcon>
                    <div>
                        <Text size="sm" fw={600}>
                            {tr.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {tr.location || '-'}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'discipline',
            header: t('discipline'),
            render: (tr) => (
                <Group gap={4}>
                    {tr.disciplines?.map((d) => (
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
            render: (tr) => (
                <Text size="xs" c="dimmed">
                    {tr.startedAt ? new Date(tr.startedAt).toLocaleString() : '-'}
                </Text>
            ),
        },
    ];

    const canSubmit =
        formData.title.trim().length > 0 &&
        formData.link.trim().length > 0 &&
        formData.location.trim().length > 0 &&
        formData.startedAt.length > 0 &&
        formData.endedAt.length > 0 &&
        formData.description.trim().length > 0 &&
        formData.distance.trim().length > 0 &&
        formData.time.trim().length > 0;

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} />}
            <DataTable
                columns={columns}
                data={trainings}
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
                onAdd={(isOwner && isParticipant) || isAdmin ? open : undefined}
                addLabel={t('addTraining')}
                actions={(tr) => (
                    <Button
                        component={Link}
                        to={`/trainings/${tr.link}`}
                        variant="light"
                        size="xs"
                        leftSection={<IconEye size={14} />}
                    >
                        {t('details')}
                    </Button>
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addTraining')}>
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
                    <Group align="flex-end" gap="xs">
                        <TextInput
                            label={t('location')}
                            required
                            className="flex-1"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.currentTarget.value })}
                        />
                        <ActionIcon variant="light" size="lg" onClick={handleGetLocation} title={t('location')}>
                            <IconCurrentLocation size={18} />
                        </ActionIcon>
                    </Group>
                    <Select
                        label={t('discipline')}
                        required
                        data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                        value={formData.discipline}
                        onChange={(val) => val && setFormData({ ...formData, discipline: val })}
                    />
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('distanceMeters')}
                            required
                            value={formData.distance}
                            onChange={(e) => setFormData({ ...formData, distance: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('timeSeconds')}
                            required
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.currentTarget.value })}
                        />
                    </SimpleGrid>
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
                    <Textarea
                        label={t('description')}
                        required
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
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
