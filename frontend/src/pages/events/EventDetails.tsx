import { useMemo } from 'react';
import { Card, Title, Text, Group, Button, Stack, Badge, Table, Image, Paper, ActionIcon, Tooltip, MantineThemeProvider } from '@mantine/core';
import NotFound from '../../components/NotFound';
import { notifications } from '@mantine/notifications';
import { IconMapPin, IconClock, IconTrash, IconCheck } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { eventService, pageService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { formatImageSrc } from '../../utils/imageUtils';
import { PageNav } from '../../components/PageNav';

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

    const { data: pagesData } = useQuery({
        queryKey: ['pages-with-participants'],
        queryFn: () => pageService.getPages({ limit: 100, 'include[]': ['pageParticipants'] }),
        enabled: !!event?.pageParticipantId,
    });

    const page = useMemo(() => {
        if (!event?.pageParticipantId || !pagesData?.data) return null;
        return pagesData.data.find((p) => p.participants?.some((part) => part.id === event.pageParticipantId)) ?? null;
    }, [event?.pageParticipantId, pagesData]);

    const isOwner = isAdmin;

    // Sign up for distance mutation
    const signUpMutation = useMutation({
        mutationFn: (distanceId: string) => eventService.signUpForDistance(distanceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', link] });
            notifications.show({ title: t('events'), message: t('signedUpForStartList'), color: 'green' });
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
            notifications.show({ title: t('events'), message: t('eventDeleted'), color: 'green' });
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
        return <NotFound title={t('eventNotFound')} />;
    }

    const eventPhotoSrc = formatImageSrc(event.photo);
    const primaryColor = ColorEnum.getMantineColor(page?.color);

    return (
        <MantineThemeProvider theme={{ primaryColor }} inherit>
            <Stack gap="lg">
                {page && <PageNav page={page} />}

                <Card withBorder radius="md" p="lg" shadow="xs">
                    {eventPhotoSrc && (
                        <Image src={eventPhotoSrc} alt={event.title} radius="md" mah={300} fit="cover" mb="md" />
                    )}

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
                            <Tooltip label={t('delete')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size={30}
                                    onClick={() => deleteMutation.mutate()}
                                    loading={deleteMutation.isPending}
                                    aria-label={t('delete')}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
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
                                    <Badge size="md">
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
                                                            leftSection={<IconCheck size={16} />}
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
        </MantineThemeProvider>
    );
}
