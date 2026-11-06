import { useMemo, useEffect } from 'react';
import {
    Card,
    Text,
    Button,
    Stack,
    Center,
    Loader,
    Group,
    Table,
    Avatar,
    Title,
    MantineThemeProvider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import NotFound from '../../components/NotFound';
import { EmptyState } from '../../components/EmptyState';
import { notifications } from '@mantine/notifications';
import { IconBookmark, IconBookmarkOff, IconPlus } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { brown } from '../../theme';
import { applyThemeColor } from '../../utils/themeUtils';
import { getErrorMessage } from '../../api/client';
import { pageService, eventService, type PageParticipantResource, type EventResource } from '../../api/services';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { useAuth } from '../../auth/AuthContext';
import { PageNav } from '../../components/PageNav';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatImageSrc } from '../../utils/imageUtils';
import { formatDateTime } from '../../utils/date';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { PageFormModal } from '../../components/pages/PageFormModal';
import { EventFormModal } from '../../components/events/EventFormModal';
import { useMyFriends } from '../../hooks/useMyFriends';
import { useUsersMap } from '../../hooks/useUsersMap';
import { UserInfoCell } from '../../components/common/UserInfoCell';

export default function PageDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser, isOrganizer, isAdmin } = useAuth();

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [createEventOpened, { open: openCreateEvent, close: closeCreateEvent }] = useDisclosure(false);

    const { data: page, isLoading } = useQuery({
        queryKey: ['page', link],
        queryFn: async () => {
            if (!link) return null;
            const res = await pageService.getPages({
                params: {
                    query: {
                        filter: { link },
                        limit: 1,
                        'include[]': ['pageParticipants'],
                    },
                },
            });
            return res.data?.[0] ?? null;
        },
        enabled: !!link,
    });

    const { collaboratorOptions } = useMyFriends();

    const isOwner = currentUser?.id === page?.userId;
    const isParticipant =
        isOwner ||
        (page?.participants?.some((p) => p.userId === currentUser?.id && p.status === ElementStatusEnum.ACTIVE) ??
            false);

    const { data: followData } = useQuery({
        queryKey: ['page-follows', page?.id, currentUser?.id],
        queryFn: async () => {
            if (!page?.id || !currentUser?.id) return null;
            const res = await pageService.getPageFollows({
                params: {
                    query: {
                        filter: { pageIds: [page.id], userId: currentUser.id },
                        limit: 1,
                    },
                },
            });
            return res?.data?.[0] ?? null;
        },
        enabled: !!page?.id && !!currentUser?.id,
    });

    const { data: pageEventsData, isLoading: eventsLoading } = useQuery({
        queryKey: ['page-events', page?.id],
        queryFn: async () => {
            if (!page?.id) return [];
            const res = await eventService.getEvents({
                params: {
                    query: {
                        filter: { pageId: page.id },
                        limit: 50,
                    },
                },
            });
            return res?.data ?? [];
        },
        enabled: !!page?.id,
    });

    const pageEvents = pageEventsData ?? [];

    const participantUserIds = useMemo(() => page?.participants?.map((p) => p.userId) ?? [], [page?.participants]);
    const { getUser } = useUsersMap(participantUserIds);

    const followMutation = useMutation({
        mutationFn: async () => {
            if (!page?.id) return;
            await pageService.createPageFollow({
                params: { path: { id: page.id } },
                body: { status: PageFollowStatusEnum.ACCEPTED },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page-follows'] });
            queryClient.invalidateQueries({ queryKey: ['page', link] });
            notifications.show({
                title: t('pageFollows'),
                message: t('pageFollowed'),
                color: 'green',
            });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async (followId: string) => {
            await pageService.deletePageFollow({
                params: { path: { id: followId } },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page-follows'] });
            queryClient.invalidateQueries({ queryKey: ['page', link] });
            notifications.show({
                title: t('pageFollows'),
                message: t('pageUnfollowed'),
                color: 'green',
            });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: (status: ElementStatusEnum) => {
            if (!page?.id) throw new Error('No page');
            return pageService.updatePageStatus({
                params: { path: { id: page.id } },
                body: { status },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page', link] });
            notifications.show({ title: t('pages'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!page?.id) return;
            await pageService.deletePage({
                params: { path: { id: page.id } },
            });
        },
        onSuccess: () => {
            notifications.show({ title: t('pages'), message: t('pageDeleted'), color: 'green' });
            navigate('/pages');
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

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: ElementStatusEnum }) =>
            pageService.updatePageParticipantStatus({
                params: { path: { id: participantId } },
                body: { status },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page', link] });
            notifications.show({
                title: t('participants'),
                message: t('statusUpdated'),
                color: 'green',
            });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const primaryColor = ColorEnum.getMantineColor(page?.color);

    useEffect(() => {
        if (!primaryColor) return;
        applyThemeColor(primaryColor);
        return () => {
            applyThemeColor('blue');
        };
    }, [primaryColor]);

    if (isLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!page) {
        return <NotFound title={t('pageNotFound')} />;
    }

    const extraActions = (
        <Group gap="xs" wrap="nowrap">
            {followData ? (
                <Button
                    variant="default"
                    size="xs"
                    leftSection={<IconBookmarkOff size={16} />}
                    onClick={() => unfollowMutation.mutate(followData.id)}
                    loading={unfollowMutation.isPending}
                    disabled={unfollowMutation.isPending}
                >
                    {t('unfollowPage')}
                </Button>
            ) : (
                <Button
                    size="xs"
                    leftSection={<IconBookmark size={16} />}
                    onClick={() => followMutation.mutate()}
                    loading={followMutation.isPending}
                    disabled={followMutation.isPending}
                >
                    {t('followPage')}
                </Button>
            )}

            {(isOwner || isAdmin) && (
                <StatusActionMenu
                    currentStatus={page.status}
                    options={ElementStatusEnum.getOptions(t)}
                    onStatusChange={(status) => statusMutation.mutate(status as ElementStatusEnum)}
                    isPending={statusMutation.isPending}
                />
            )}

            {isOwner && <EditActionButton onClick={openEdit} />}
            {isOwner && <DeleteActionButton onClick={handleDelete} isPending={deleteMutation.isPending} />}
        </Group>
    );

    return (
        <MantineThemeProvider theme={{ primaryColor, colors: { brown } }} inherit>
            <Stack gap="lg">
                <PageNav page={page} extraActions={extraActions} />

                <Card withBorder radius="md" p="lg" shadow="xs">
                    {page.description && (
                        <Text size="sm" mb="md" className="pre-wrap">
                            {page.description}
                        </Text>
                    )}

                    <Title order={4} mb="xs">
                        {t('participants')}
                    </Title>
                    {!page.participants || page.participants.length === 0 ? (
                        <EmptyState title={t('noData')} />
                    ) : (
                        <Table.ScrollContainer minWidth={600}>
                            <Table
                                striped
                                highlightOnHover
                                withTableBorder
                                withColumnBorders
                                withRowBorders
                                verticalSpacing="sm"
                            >
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>{t('user')}</Table.Th>
                                        <Table.Th>{t('status')}</Table.Th>
                                        <Table.Th w={120} ta="right">
                                            {t('actions')}
                                        </Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {page.participants?.map((p: PageParticipantResource) => {
                                        const u = getUser(p.userId);
                                        const isSelf = p.userId === currentUser?.id;

                                        return (
                                            <Table.Tr key={p.id}>
                                                <Table.Td>
                                                    <UserInfoCell user={u} userId={p.userId} />
                                                </Table.Td>
                                                <Table.Td>
                                                    <StatusBadge status={p.status} enumType={ElementStatusEnum} />
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                                                        {u?.link && <ViewActionButton to={`/users/${u.link}`} />}
                                                        {isSelf && (
                                                            <StatusActionMenu
                                                                currentStatus={p.status}
                                                                options={ElementStatusEnum.getOptions(t)}
                                                                onStatusChange={(status) =>
                                                                    updateParticipantStatusMutation.mutate({
                                                                        participantId: p.id,
                                                                        status: status as ElementStatusEnum,
                                                                    })
                                                                }
                                                                isPending={updateParticipantStatusMutation.isPending}
                                                            />
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}

                    <Group justify="space-between" align="center" mt="lg" mb="xs">
                        <Title order={4}>{t('events')}</Title>
                        {isOrganizer && isParticipant && (
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconPlus size={16} />}
                                onClick={openCreateEvent}
                            >
                                {t('addEvent')}
                            </Button>
                        )}
                    </Group>

                    {eventsLoading ? (
                        <Center h={100}>
                            <Loader size="sm" />
                        </Center>
                    ) : pageEvents.length === 0 ? (
                        <EmptyState title={t('noData')} />
                    ) : (
                        <Table.ScrollContainer minWidth={600}>
                            <Table
                                striped
                                highlightOnHover
                                withTableBorder
                                withColumnBorders
                                withRowBorders
                                verticalSpacing="sm"
                            >
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>{t('title')}</Table.Th>
                                        <Table.Th>{t('startedAt')}</Table.Th>
                                        <Table.Th>{t('endedAt')}</Table.Th>
                                        <Table.Th>{t('status')}</Table.Th>
                                        <Table.Th w={120} ta="right">
                                            {t('actions')}
                                        </Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {pageEvents.map((ev: EventResource) => (
                                        <Table.Tr key={ev.id}>
                                            <Table.Td>
                                                <Group gap="sm">
                                                    <Avatar src={formatImageSrc(ev.photo)} radius={5}>
                                                        ?
                                                    </Avatar>
                                                    <div>
                                                        <Text size="sm" fw={600}>
                                                            {ev.title}
                                                        </Text>
                                                        <Text size="sm" c="dimmed">
                                                            {ev.location || '-'}
                                                        </Text>
                                                    </div>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {formatDateTime(ev.startedAt)}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">
                                                    {formatDateTime(ev.endedAt)}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <StatusBadge status={ev.status} enumType={ElementStatusEnum} />
                                            </Table.Td>
                                            <Table.Td ta="right">
                                                <ViewActionButton to={`/events/${ev.link}`} />
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}
                </Card>

                <PageFormModal
                    opened={editOpened}
                    onClose={closeEdit}
                    page={page}
                    collaboratorOptions={collaboratorOptions}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['page', link] });
                    }}
                />

                <EventFormModal
                    opened={createEventOpened}
                    onClose={closeCreateEvent}
                    defaultPageParticipantId={page.id}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['page-events', page.id] });
                    }}
                />
            </Stack>
        </MantineThemeProvider>
    );
}
