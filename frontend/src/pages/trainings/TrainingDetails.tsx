import {
    Card,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Table,
    Paper,
    ActionIcon,
    Tooltip,
    MantineThemeProvider,
} from '@mantine/core';
import NotFound from '../../components/NotFound';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconMapPin, IconClock } from '@tabler/icons-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { trainingService, userService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { UserProfileNav } from '../../components/UserProfileNav';

export default function TrainingDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentUser, isAdmin } = useAuth();

    const { data: training, isLoading } = useQuery({
        queryKey: ['training', link],
        queryFn: () => trainingService.getTrainingByLink(link || ''),
        enabled: !!link,
    });

    const { data: ownerUserData } = useQuery({
        queryKey: ['user', training?.userId],
        queryFn: () => (training?.userId ? userService.getUser(training.userId) : null),
        enabled: !!training?.userId,
    });

    const ownerUser = ownerUserData?.data ?? null;
    const isOwner = currentUser?.id === training?.userId || isAdmin;

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!training?.id) return;
            await trainingService.deleteTraining(training.id);
        },
        onSuccess: () => {
            notifications.show({ title: t('trainings'), message: t('trainingDeleted'), color: 'green' });
            navigate(-1);
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDelete = () => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteMutation.mutate(),
        });
    };

    if (isLoading) {
        return (
            <Text ta="center" py="xl">
                {t('loading')}
            </Text>
        );
    }

    if (!training) {
        return <NotFound title={t('trainingNotFound')} />;
    }

    const primaryColor = ColorEnum.getMantineColor(ownerUser?.color);

    return (
        <MantineThemeProvider theme={{ primaryColor }} inherit>
            <Stack gap="lg">
                {ownerUser && <UserProfileNav user={ownerUser} isOwner={currentUser?.id === ownerUser.id} />}

                <Card withBorder radius="md" p="lg" shadow="xs">
                    <Group justify="space-between" align="flex-start" mb="md">
                        <div>
                            <Title order={2}>{training.title}</Title>
                            <Group gap="xs" mt={4}>
                                <IconMapPin size={16} />
                                <Text size="sm" c="dimmed">
                                    {training.location || '-'}
                                </Text>
                            </Group>
                        </div>

                        {isOwner && (
                            <Tooltip label={t('delete')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size={30}
                                    onClick={handleDelete}
                                    loading={deleteMutation.isPending}
                                    disabled={deleteMutation.isPending}
                                    aria-label={t('delete')}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>

                    <Group gap="xs" mb="md">
                        <IconClock size={16} />
                        <Text size="xs" c="dimmed">
                            {training.startedAt ? new Date(training.startedAt).toLocaleString() : ''} -{' '}
                            {training.endedAt ? new Date(training.endedAt).toLocaleString() : ''}
                        </Text>
                    </Group>

                    {training.description && (
                        <Text size="sm" mb="md" className="pre-wrap">
                            {training.description}
                        </Text>
                    )}

                    <Title order={4} mb="xs">
                        {t('disciplinesAndDistances')}
                    </Title>
                    <Stack gap="sm">
                        {training.disciplines?.map((disc) => (
                            <Paper key={disc.id} withBorder p="sm" radius="md">
                                <Badge mb="xs">
                                    {DisciplineEnum.getOptions(t).find((o) => o.value === disc.discipline)?.label ??
                                        disc.discipline}
                                </Badge>
                                <Table striped>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>{t('distance')}</Table.Th>
                                            <Table.Th>{t('time')}</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {disc.distances?.map((dist) => (
                                            <Table.Tr key={dist.id}>
                                                <Table.Td>{dist.distance} m</Table.Td>
                                                <Table.Td>{dist.time} s</Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Paper>
                        ))}
                    </Stack>
                </Card>
            </Stack>
        </MantineThemeProvider>
    );
}
