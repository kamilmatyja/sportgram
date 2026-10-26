import { Card, Title, Text, Group, Button, Stack, Avatar, Box, Paper, BackgroundImage } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBuildingStore, IconBookmark, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { pageService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';

export default function PageDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser, isAdmin } = useAuth();

    const { data: page, isLoading } = useQuery({
        queryKey: ['page', link],
        queryFn: () => pageService.getPageByLink(link || ''),
        enabled: !!link,
    });

    const isOwner = currentUser?.id === page?.userId || isAdmin;

    // Check if following
    const { data: followData } = useQuery({
        queryKey: ['page-follows', page?.id, currentUser?.id],
        queryFn: async () => {
            if (!page?.id || !currentUser?.id) return null;
            const res = await pageService.getPageFollows(page.id, currentUser.id);
            return res?.data?.find((f) => f.userId === currentUser.id) ?? null;
        },
        enabled: !!page?.id && !!currentUser?.id,
    });

    const followMutation = useMutation({
        mutationFn: async () => {
            if (!page?.id) return;
            await pageService.followPage(page.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page-follows'] });
            notifications.show({ title: t('pageFollows'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: async (followId: string) => {
            await pageService.unfollowPage(followId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page-follows'] });
            notifications.show({ title: t('pageFollows'), message: t('deleted'), color: 'blue' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!page?.id) return;
            await pageService.deletePage(page.id);
        },
        onSuccess: () => {
            notifications.show({ title: t('pages'), message: t('deleted'), color: 'blue' });
            navigate('/pages');
        },
    });

    if (isLoading) {
        return (
            <Text ta="center" py="xl">
                {t('loading')}
            </Text>
        );
    }

    if (!page) {
        return (
            <Paper withBorder p="xl" radius="md" ta="center">
                <Text c="dimmed">{t('noRecords')}</Text>
            </Paper>
        );
    }

    return (
        <Stack gap="lg" className="max-w-800">
            <Card withBorder radius="md" p={0} shadow="xs">
                {page.backgroundPhoto ? (
                    <BackgroundImage src={page.backgroundPhoto} h={140} />
                ) : (
                    <Box h={140} bg="blue.7" />
                )}

                <Box p="md" className="relative">
                    <Avatar
                        src={page.profilePhoto || undefined}
                        size={80}
                        radius="md"
                        color="blue"
                        className="page-avatar-overlap"
                    >
                        <IconBuildingStore size={40} />
                    </Avatar>

                    <Group justify="space-between" align="flex-start" mt={45}>
                        <div>
                            <Title order={2}>{page.title}</Title>
                            <Text size="sm" c="dimmed">
                                @{page.link}
                            </Text>
                        </div>

                        <Group gap="xs">
                            {followData ? (
                                <Button
                                    variant="default"
                                    size="xs"
                                    onClick={() => unfollowMutation.mutate(followData.id)}
                                    loading={unfollowMutation.isPending}
                                >
                                    {t('unfollowPage')}
                                </Button>
                            ) : (
                                <Button
                                    size="xs"
                                    leftSection={<IconBookmark size={16} />}
                                    onClick={() => followMutation.mutate()}
                                    loading={followMutation.isPending}
                                >
                                    {t('followPage')}
                                </Button>
                            )}

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
                    </Group>

                    {page.description && (
                        <Text size="sm" mt="md" className="pre-wrap">
                            {page.description}
                        </Text>
                    )}
                </Box>
            </Card>
        </Stack>
    );
}
