import { Card, Text, Button, Stack, ActionIcon, Tooltip, MantineThemeProvider } from '@mantine/core';
import NotFound from '../../components/NotFound';
import { notifications } from '@mantine/notifications';
import { IconBookmark, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { pageService } from '../../api/services';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { useAuth } from '../../auth/AuthContext';
import { PageNav } from '../../components/PageNav';
import {openConfirmActionModal} from "../../utils/confirmModal.tsx";

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
            await pageService.followPage(page.id, PageFollowStatusEnum.ACCEPTED);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['page-follows'] });
            notifications.show({ title: t('pageFollows'), message: t('pageFollowed'), color: 'green' });
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
            notifications.show({ title: t('pageFollows'), message: t('pageUnfollowed'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!page?.id) return;
            await pageService.deletePage(page.id);
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

    if (isLoading) {
        return (
            <Text ta="center" py="xl">
                {t('loading')}
            </Text>
        );
    }

    if (!page) {
        return <NotFound title={t('pageNotFound')} />;
    }

    const primaryColor = ColorEnum.getMantineColor(page.color);

    const extraActions = (
        <>
            {followData ? (
                <Button
                    variant="default"
                    size="xs"
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
        </>
    );

    return (
        <MantineThemeProvider theme={{ primaryColor }} inherit>
            <Stack gap="lg">
                <PageNav page={page} extraActions={extraActions} />

                {page.description && (
                    <Card withBorder radius="md" p="md" shadow="xs">
                        <Text size="sm" className="pre-wrap">
                            {page.description}
                        </Text>
                    </Card>
                )}
            </Stack>
        </MantineThemeProvider>
    );
}
