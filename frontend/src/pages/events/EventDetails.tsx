import { Card, Title, Text, Group, Button, Stack, Badge, Paper, Table, Image } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMapPin, IconClock, IconTrash, IconCheck } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { eventService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export default function EventDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isParticipant, isAdmin } = useAuth();

    const { data: event, isLoading } = useQuery({
        queryKey: ['event', link],
        queryFn: () => eventService.getEventByLink(link || ''),
        enabled: !!link,
    });

    const isOwner = isAdmin;

    // Sign up for distance mutation
    const signUpMutation = useMutation({
        mutationFn: (distanceId: string) => eventService.signUpForDistance(distanceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', link] });
            notifications.show({ title: t('events'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!event?.id) return;
            await eventService.deleteEvent(event.id);
        },
        onSuccess: () => {
            notifications.show({ title: t('events'), message: t('deleted'), color: 'blue' });
            navigate('/events');
        },
    });

    if (isLoading) {
        return (
            <Text ta="center" py="xl">
                {t('loading')}
            </Text>
        );
    }

    if (!event) {
        return (
            <Paper withBorder p="xl" radius="md" ta="center">
                <Text c="dimmed">{t('noRecords')}</Text>
            </Paper>
        );
    }

    return (
        <Stack gap="lg" className="max-w-800">
            <Card withBorder radius="md" p="lg" shadow="xs">
                {event.photo && <Image src={event.photo} alt={event.title} radius="md" mah={300} fit="cover" mb="md" />}

                <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                        <Title order={2}>{event.title}</Title>
                        <Group gap="xs" mt="xs">
                            <IconMapPin size={16} />
                            <Text size="sm" c="dimmed">
                                {event.location || '-'}
                            </Text>
                        </Group>
                        <Group gap="xs" mt={4}>
                            <IconClock size={16} />
                            <Text size="xs" c="dimmed">
                                {event.startedAt ? new Date(event.startedAt).toLocaleString() : ''} -{' '}
                                {event.endedAt ? new Date(event.endedAt).toLocaleString() : ''}
                            </Text>
                        </Group>
                    </div>

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

                {event.description && (
                    <Text size="sm" mb="md" className="pre-wrap">
                        {event.description}
                    </Text>
                )}

                {event.rules && (
                    <Paper withBorder p="sm" radius="sm" mb="md">
                        <Text size="xs" fw={700} c="dimmed" mb={4}>
                            {t('rules')}
                        </Text>
                        <Text size="xs" className="pre-wrap">
                            {event.rules}
                        </Text>
                    </Paper>
                )}

                <Title order={4} mb="sm">
                    {t('disciplinesAndDistances')}
                </Title>

                <Stack gap="sm">
                    {event.disciplines?.map((disc) => (
                        <Paper key={disc.id} withBorder p="sm" radius="md">
                            <Group justify="space-between" mb="xs">
                                <Badge color="blue" size="md">
                                    {DisciplineEnum.getOptions(t).find((o) => o.value === disc.discipline)?.label ??
                                        disc.discipline}
                                </Badge>
                            </Group>

                            <Table striped>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>{t('distance')}</Table.Th>
                                        <Table.Th className="text-right">{t('action')}</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {disc.distances?.map((dist) => (
                                        <Table.Tr key={dist.id}>
                                            <Table.Td>
                                                <Text fw={500} size="sm">
                                                    {dist.distance} m
                                                </Text>
                                            </Table.Td>
                                            <Table.Td className="text-right">
                                                {isParticipant && (
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        leftSection={<IconCheck size={14} />}
                                                        onClick={() => signUpMutation.mutate(dist.id)}
                                                        loading={signUpMutation.isPending}
                                                    >
                                                        {t('saveUp')}
                                                    </Button>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Paper>
                    ))}
                </Stack>
            </Card>
        </Stack>
    );
}
