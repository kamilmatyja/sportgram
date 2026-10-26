import { useState } from 'react';
import { Card, Text, Group, Button, Stack, Avatar, ActionIcon, Modal, Textarea, FileInput, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, feedService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import UserProfileNav from '../../components/UserProfileNav';

export default function UserFeeds() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isAdmin } = useAuth();

    const [opened, { open, close }] = useDisclosure(false);
    const [text, setText] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);

    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const isOwner = currentUser?.id === targetUser?.id;

    const { data: feeds, isLoading } = useQuery({
        queryKey: ['user-feeds', targetUser?.id],
        queryFn: () => (targetUser?.id ? feedService.getUserFeeds(targetUser.id) : Promise.resolve([])),
        enabled: !!targetUser?.id,
    });

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!photo) {
                throw new Error(t('photo') + ' ' + t('required'));
            }
            const photoStr = await fileToBase64(photo);
            await feedService.createFeed({ text, photo: photoStr });
        },
        onSuccess: () => {
            setText('');
            setPhoto(null);
            close();
            queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
            notifications.show({ title: t('feeds'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => feedService.deleteFeed(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
            notifications.show({ title: t('feeds'), message: t('deleted'), color: 'blue' });
        },
    });

    return (
        <Stack gap="md" className="max-w-680">
            {targetUser && <UserProfileNav user={targetUser} />}

            <Group justify="space-between">
                <Text size="lg" fw={600}>
                    {t('feeds')} @{targetUser?.link}
                </Text>
                {(isOwner || isAdmin) && (
                    <Button size="xs" leftSection={<IconPlus size={16} />} onClick={open}>
                        {t('addFeed')}
                    </Button>
                )}
            </Group>

            {isLoading ? (
                <Text ta="center" c="dimmed">
                    {t('loading')}
                </Text>
            ) : feeds?.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <Text c="dimmed">{t('noRecords')}</Text>
                </Card>
            ) : (
                feeds?.map((feed) => (
                    <Card key={feed.id} withBorder radius="md" p="md">
                        <Group justify="space-between" mb="xs">
                            <Group gap="sm">
                                <Avatar src={targetUser?.profilePhoto || undefined} radius="xl">
                                    {targetUser?.firstName?.[0]}
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={600}>
                                        {targetUser?.firstName} {targetUser?.lastName}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {feed.createdAt ? new Date(feed.createdAt).toLocaleString() : ''}
                                    </Text>
                                </div>
                            </Group>

                            {(isOwner || isAdmin) && (
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="sm"
                                    onClick={() => deleteMutation.mutate(feed.id)}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            )}
                        </Group>

                        <Text size="sm" className="pre-wrap">
                            {feed.text}
                        </Text>

                        {feed.photo && (
                            <Box mt="sm" className="feed-image-box">
                                <img src={feed.photo} alt={t('photo')} className="feed-image" />
                            </Box>
                        )}
                    </Card>
                ))
            )}

            <Modal opened={opened} onClose={close} title={t('addFeed')}>
                <Stack gap="sm">
                    <Textarea
                        required
                        label={t('description')}
                        rows={3}
                        value={text}
                        onChange={(e) => setText(e.currentTarget.value)}
                    />
                    <FileInput
                        required
                        label={t('photo')}
                        accept="image/*"
                        value={photo}
                        onChange={setPhoto}
                        clearable
                    />
                    <Button
                        loading={createMutation.isPending}
                        disabled={!text.trim() || !photo}
                        onClick={() => createMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
