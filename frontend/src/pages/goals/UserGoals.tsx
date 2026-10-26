import { useState } from 'react';
import { Group, Text, Button, Modal, Stack, TextInput, Badge, Select, SimpleGrid, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconTarget } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, goalService, type GoalResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export default function UserGoals() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isParticipant, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    const [opened, { open, close }] = useDisclosure(false);
    const [formData, setFormData] = useState({
        text: '',
        link: '',
        discipline: '1',
        distance: '10000',
        time: '',
        startedAt: '',
        endedAt: '',
    });

    // Fetch target user by link
    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const isOwner = currentUser?.id === targetUser?.id;

    // Fetch goals
    const { data, isLoading } = useQuery({
        queryKey: ['goals', targetUser?.id, page, limit, search],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return goalService.getGoals({
                page,
                limit,
                filter: { userId: targetUser.id, text: search || null },
                sort: 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id,
    });

    const goals = data?.data ?? [];
    const pagination = data?.pagination;

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!currentUser?.id) return;
            await goalService.createGoal({
                text: formData.text,
                link: formData.link,
                discipline: Number(formData.discipline) as any,
                distance: Number(formData.distance) || 0,
                time: formData.time ? Number(formData.time) : null,
                startedAt: formData.startedAt ? formData.startedAt : null,
                endedAt: formData.endedAt ? formData.endedAt : null,
                userIds: [currentUser.id],
            });
        },
        onSuccess: () => {
            close();
            setFormData({
                text: '',
                link: '',
                discipline: '1',
                distance: '10000',
                time: '',
                startedAt: '',
                endedAt: '',
            });
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            notifications.show({ title: t('goals'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const columns: Column<GoalResource>[] = [
        {
            key: 'text',
            header: t('title'),
            render: (g) => (
                <Group gap="sm">
                    <ThemeIcon variant="light" color="blue" size="md">
                        <IconTarget size={18} />
                    </ThemeIcon>
                    <div>
                        <Text size="sm" fw={600}>
                            {g.text}
                        </Text>
                        <Text size="xs" c="dimmed">
                            @{g.link}
                        </Text>
                    </div>
                </Group>
            ),
        },
        {
            key: 'discipline',
            header: t('discipline'),
            render: (g) => (
                <Badge size="xs" variant="outline">
                    {DisciplineEnum.getOptions(t).find((o) => o.value === g.discipline)?.label ?? g.discipline}
                </Badge>
            ),
        },
        {
            key: 'distance',
            header: t('distance'),
            render: (g) => <Text size="xs">{g.distance} m</Text>,
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (g) => (
                <Text size="xs" c="dimmed">
                    {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '-'}
                </Text>
            ),
        },
    ];

    const canSubmit =
        formData.text.trim().length > 0 &&
        formData.link.trim().length > 0 &&
        formData.discipline.length > 0 &&
        formData.distance.trim().length > 0;

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} />}
            <DataTable
                columns={columns}
                data={goals}
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
                addLabel={t('addGoal')}
                actions={(g) => (
                    <Button
                        component={Link}
                        to={`/goals/${g.link}`}
                        variant="light"
                        size="xs"
                        leftSection={<IconEye size={14} />}
                    >
                        {t('details')}
                    </Button>
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addGoal')}>
                <Stack gap="sm">
                    <TextInput
                        label={t('title')}
                        required
                        value={formData.text}
                        onChange={(e) => {
                            const text = e.currentTarget.value;
                            const link = text
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setFormData({ ...formData, text, link });
                        }}
                    />
                    <TextInput
                        label={t('link')}
                        required
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                    />
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
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.currentTarget.value })}
                        />
                    </SimpleGrid>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('startedAt')}
                            type="datetime-local"
                            value={formData.startedAt}
                            onChange={(e) => setFormData({ ...formData, startedAt: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('endedAt')}
                            type="datetime-local"
                            value={formData.endedAt}
                            onChange={(e) => setFormData({ ...formData, endedAt: e.currentTarget.value })}
                        />
                    </SimpleGrid>
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
