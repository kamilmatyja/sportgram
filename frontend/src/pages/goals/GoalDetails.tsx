import {
    Card,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Table,
    ActionIcon,
    Tooltip,
    MantineThemeProvider,
} from '@mantine/core';
import NotFound from '../../components/NotFound';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { goalService, userService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { UserProfileNav } from '../../components/UserProfileNav';

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

    const { data: ownerUserData } = useQuery({
        queryKey: ['user', goal?.userId],
        queryFn: () => (goal?.userId ? userService.getUser(goal.userId) : null),
        enabled: !!goal?.userId,
    });

    const ownerUser = ownerUserData?.data ?? null;
    const isOwner = currentUser?.id === goal?.userId || isAdmin;

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!goal?.id) return;
            await goalService.deleteGoal(goal.id);
        },
        onSuccess: () => {
            notifications.show({ title: t('goals'), message: t('goalDeleted'), color: 'green' });
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
        return <NotFound title={t('goalNotFound')} />;
    }

    const primaryColor = ColorEnum.getMantineColor(ownerUser?.color);

    return (
        <MantineThemeProvider theme={{ primaryColor }} inherit>
            <Stack gap="lg">
                {ownerUser && <UserProfileNav user={ownerUser} isOwner={currentUser?.id === ownerUser.id} />}

                <Card withBorder radius="md" p="lg" shadow="xs">
                    <Group justify="space-between" align="flex-start" mb="md">
                        <div>
                            <Title order={2}>{goal.text}</Title>
                            <Text size="sm" c="dimmed">
                                @{goal.link}
                            </Text>
                        </div>

                        {isOwner && (
                            <Tooltip label={t('delete')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size={30}
                                    onClick={() => deleteMutation.mutate()}
                                    loading={deleteMutation.isPending}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>

                    <Group gap="sm" mb="md">
                        <Badge size="lg">
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
        </MantineThemeProvider>
    );
}
