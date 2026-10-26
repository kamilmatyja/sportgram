import { Card, Title, Text, Group, Button, Stack, Badge, Paper, Table, ThemeIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTarget, IconTrash, IconClock } from '@tabler/icons-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { goalService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export default function GoalDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentUser, isAdmin } = useAuth();

    const { data: goal, isLoading } = useQuery({
        queryKey: ['goal', link],
        queryFn: () => goalService.getGoalByLink(link || ''),
        enabled: !!link,
    });

    const isOwner = currentUser?.id === goal?.userId || isAdmin;

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!goal?.id) return;
            await goalService.deleteGoal(goal.id);
        },
        onSuccess: () => {
            notifications.show({ title: t('goals'), message: t('deleted'), color: 'blue' });
            navigate(-1);
        },
    });

    if (isLoading) {
        return (
            <Text ta="center" py="xl">
                {t('loading')}
            </Text>
        );
    }

    if (!goal) {
        return (
            <Paper withBorder p="xl" radius="md" ta="center">
                <Text c="dimmed">{t('noRecords')}</Text>
            </Paper>
        );
    }

    return (
        <Stack gap="lg" className="max-w-800">
            <Card withBorder radius="md" p="lg" shadow="xs">
                <Group justify="space-between" align="flex-start" mb="md">
                    <Group gap="sm">
                        <ThemeIcon variant="light" color="blue" size="xl">
                            <IconTarget size={28} />
                        </ThemeIcon>
                        <div>
                            <Title order={2}>{goal.text}</Title>
                            <Text size="sm" c="dimmed">
                                @{goal.link}
                            </Text>
                        </div>
                    </Group>

                    {isOwner && (
                        <Button
                            variant="subtle"
                            color="red"
                            size="xs"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => deleteMutation.mutate()}
                            loading={deleteMutation.isPending}
                        >
                            {t('delete')}
                        </Button>
                    )}
                </Group>

                <Group gap="sm" mb="md">
                    <Badge size="lg" color="blue">
                        {DisciplineEnum.getOptions(t).find((o) => o.value === goal.discipline)?.label ??
                            goal.discipline}
                    </Badge>
                    <Badge size="lg" color="teal" variant="light">
                        {goal.distance} m
                    </Badge>
                    {goal.time && (
                        <Badge size="lg" color="orange" variant="light">
                            {goal.time} s
                        </Badge>
                    )}
                </Group>

                <Group gap="xs" mb="md">
                    <ThemeIcon variant="subtle" color="gray" size="sm">
                        <IconClock size={16} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed">
                        {goal.startedAt ? new Date(goal.startedAt).toLocaleString() : ''} -{' '}
                        {goal.endedAt ? new Date(goal.endedAt).toLocaleString() : ''}
                    </Text>
                </Group>

                <Title order={4} mb="xs">
                    {t('participants')}
                </Title>
                <Table striped>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>{t('user')}</Table.Th>
                            <Table.Th>{t('status')}</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {goal.participants?.map((p) => (
                            <Table.Tr key={p.id}>
                                <Table.Td>{p.userId}</Table.Td>
                                <Table.Td>
                                    <Badge size="xs" variant="light">
                                        {t('active')}
                                    </Badge>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}
