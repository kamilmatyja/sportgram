import { useMemo, useEffect } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Image,
    Paper,
    MantineThemeProvider,
    Center,
    Loader,
    Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMapPin, IconClock } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, pageService } from '../../api/services';
import { useAuth } from '../../auth';
import { EmptyState } from '../../components';
import { EntityViewCounter } from '../../components';
import NotFound from '../../components/NotFound';
import { PageNav } from '../../components';
import { StatusBadge, StatusActionMenu, EditActionButton, DeleteActionButton } from '../../components';
import { DistanceParticipantsSection } from '../../components/events/DistanceParticipantsSection';
import { EventFormModal } from '../../components';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { createDynamicTheme } from '../../theme';
import {
    applyThemeColor,
    confirmDelete,
    formatDateTime,
    formatImageSrc,
    notifyError,
    notifySuccess,
} from '../../utils';

export default function EventDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser, isParticipant, isAdmin } = useAuth();

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

    const { data: event, isLoading: eventLoading } = useQuery({
        queryKey: ['event', link],
        queryFn: async () => {
            if (!link) return null;
            const res = await eventService.getEvents({
                params: {
                    query: {
                        filter: { link },
                        limit: 1,
                        'include[]': ['eventDisciplines', 'eventDisciplineDistances', 'eventDisciplineSubDistances'],
                    },
                },
            });
            return res.data?.[0] ?? null;
        },
        enabled: !!link,
    });

    const { data: pagesData } = useQuery({
        queryKey: ['pages-with-participants'],
        queryFn: () =>
            pageService.getPages({
                params: {
                    query: {
                        limit: 100,
                        'include[]': ['pageParticipants'],
                    },
                },
            }),
        enabled: !!event?.pageParticipantId,
    });

    const page = useMemo(() => {
        if (!event?.pageParticipantId || !pagesData?.data) return null;
        return pagesData.data.find((p) => p.participants?.some((part) => part.id === event.pageParticipantId)) ?? null;
    }, [event?.pageParticipantId, pagesData]);

    const isOwner =
        page?.participants?.some((p) => p.id === event?.pageParticipantId && p.userId === currentUser?.id) ?? false;
    const canManageStatus = isOwner || isAdmin;

    const signUpMutation = useMutation({
        mutationFn: (distanceId: string) =>
            eventService.createEventDisciplineDistanceList({
                params: { path: { id: distanceId } },
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['distance-participants'] });
            notifySuccess(t('saved'), t('events'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const statusMutation = useMutation({
        mutationFn: (status: ElementStatusEnum) => {
            if (!event?.id) throw new Error('No event');
            return eventService.updateEventStatus({
                params: { path: { id: event.id } },
                body: { status },
            });
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['event', link] });
            notifySuccess(t('statusUpdated'), t('events'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!event?.id) return;
            await eventService.deleteEvent({ params: { path: { id: event.id } } });
        },
        onSuccess: () => {
            notifySuccess(t('deleted'), t('events'));
            navigate('/events');
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const primaryColor = ColorEnum.getMantineColor(page?.color);

    useEffect(() => {
        if (!primaryColor) return;
        applyThemeColor(primaryColor);
        return () => {
            applyThemeColor('blue');
        };
    }, [primaryColor]);

    if (eventLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!event) {
        return <NotFound title={t('notFound')} />;
    }

    const eventPhotoSrc = formatImageSrc(event.photo);
    const dynamicTheme = useMemo(() => createDynamicTheme(primaryColor), [primaryColor]);

    return (
        <MantineThemeProvider theme={dynamicTheme} inherit>
            <Stack gap="lg">
                {page && <PageNav page={page} simplifiedHeader={true} />}

                <Card>
                    {eventPhotoSrc && <Image src={eventPhotoSrc} alt={event.title} mah={300} mb="md" />}

                    <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
                        <div>
                            <Title order={2}>{event.title}</Title>
                            <Group gap="xs" align="center" mt={2}>
                                <Text size="sm" c="dimmed">
                                    @{event.link}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    •
                                </Text>
                                <EntityViewCounter entityId={event.id} type={EntryTypeEnum.EVENT} />
                            </Group>
                            <Group gap="xs" mt="xs">
                                <IconMapPin size={16} />
                                <Text size="sm" c="dimmed">
                                    {event.location || '-'}
                                </Text>
                            </Group>
                            <Group gap="xs" mt={4}>
                                <IconClock size={16} />
                                <Text size="xs" c="dimmed">
                                    {event.startedAt ? formatDateTime(event.startedAt) : ''} -{' '}
                                    {event.endedAt ? formatDateTime(event.endedAt) : ''}
                                </Text>
                            </Group>
                        </div>

                        <Group gap="xs" wrap="nowrap">
                            {canManageStatus && (
                                <StatusActionMenu
                                    status={event.status}
                                    onStatusChange={(status) => statusMutation.mutate(status)}
                                    isPending={statusMutation.isPending}
                                />
                            )}

                            {isOwner && (
                                <>
                                    <EditActionButton onClick={openEdit} />
                                    <DeleteActionButton
                                        onClick={() => confirmDelete(t, () => deleteMutation.mutate())}
                                        loading={deleteMutation.isPending}
                                        disabled={deleteMutation.isPending}
                                    />
                                </>
                            )}
                        </Group>
                    </Group>

                    <Group mb="md">
                        <StatusBadge status={event.status} />
                    </Group>

                    {event.description && (
                        <Text size="sm" mb="md" className="pre-wrap">
                            {event.description}
                        </Text>
                    )}

                    {event.rules && (
                        <Box mb="md">
                            <Text size="xs" fw={700} c="dimmed" mb={4}>
                                {t('rules')}
                            </Text>
                            <Text size="xs" className="pre-wrap">
                                {event.rules}
                            </Text>
                        </Box>
                    )}

                    <Title order={4} mb="sm">
                        {t('disciplinesAndDistances')}
                    </Title>

                    {!event.disciplines || event.disciplines.length === 0 ? (
                        <EmptyState title={t('noData')} />
                    ) : (
                        <Stack>
                            {event.disciplines.map((disc) => (
                                <Paper key={disc.id}>
                                    <Badge mb="sm">
                                        {DisciplineEnum.getOptions(t).find((o) => o.value === disc.discipline)?.label ??
                                            disc.discipline}
                                    </Badge>

                                    <Stack gap="xs">
                                        {disc.distances?.map((dist) => (
                                            <DistanceParticipantsSection
                                                key={dist.id}
                                                distance={dist}
                                                isOwner={isOwner}
                                                isAdmin={isAdmin}
                                                isParticipant={isParticipant}
                                                currentUserId={currentUser?.id}
                                                onSignUp={(dId) => signUpMutation.mutate(dId)}
                                                isSigningUp={signUpMutation.isPending}
                                                primaryColor={primaryColor}
                                            />
                                        ))}
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Card>

                <EventFormModal
                    opened={editOpened}
                    onClose={closeEdit}
                    event={event}
                    onSuccess={() => void queryClient.invalidateQueries({ queryKey: ['event', link] })}
                />
            </Stack>
        </MantineThemeProvider>
    );
}
