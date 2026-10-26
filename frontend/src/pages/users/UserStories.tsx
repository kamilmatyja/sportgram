import { useState } from 'react';
import {
    Stack,
    Group,
    Text,
    Button,
    Card,
    SimpleGrid,
    ActionIcon,
    Modal,
    Textarea,
    FileInput,
    Image,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconPhoto } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { storyService, userService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { UserProfileNav } from '../../components/UserProfileNav';

export default function UserStories() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isAdmin } = useAuth();

    const [opened, { open, close }] = useDisclosure(false);
    const [text, setText] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);

    // Fetch target user
    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: async () => {
            if (!link) return null;
            return await userService.getUserByLink(link);
        },
        enabled: !!link,
    });

    const isOwner = currentUser?.id === targetUser?.id;

    // Fetch user stories
    const { data: stories, isLoading } = useQuery({
        queryKey: ['user-stories', targetUser?.id],
        queryFn: async () => {
            if (!targetUser?.id) return [];
            const res = await storyService.getStories({
                filter: { userId: targetUser.id },
                limit: 50,
            });
            return res.data ?? [];
        },
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
            if (!photo) throw new Error(t('photo') + ' ' + t('required'));
            const photoStr = await fileToBase64(photo);
            await storyService.createStory({ text, photo: photoStr });
        },
        onSuccess: () => {
            setText('');
            setPhoto(null);
            close();
            queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
            notifications.show({ title: t('stories'), message: t('storyAdded'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await storyService.deleteStory(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
            notifications.show({ title: t('stories'), message: t('storyDeleted'), color: 'blue' });
        },
    });

    return (
        <Stack gap="md" maw={680} mx="auto">
            {targetUser && <UserProfileNav userLink={targetUser.link} isOwner={isOwner} />}
            <Group justify="space-between">
                <Text size="lg" fw={600}>
                    {t('stories')} @{targetUser?.link}
                </Text>
                {(isOwner || isAdmin) && (
                    <Button size="xs" leftSection={<IconPlus size={16} />} onClick={open}>
                        {t('addStory')}
                    </Button>
                )}
            </Group>

            {isLoading ? (
                <Text ta="center" c="dimmed">
                    {t('loadingStories')}
                </Text>
            ) : stories?.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <Text c="dimmed">{t('noRecords')}</Text>
                </Card>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {stories?.map((story) => (
                        <Card key={story.id} withBorder radius="md" p="md">
                            <Group justify="space-between" mb="xs">
                                <Text size="xs" c="dimmed">
                                    {story.createdAt ? new Date(story.createdAt).toLocaleString() : ''}
                                </Text>
                                {(isOwner || isAdmin) && (
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        size="sm"
                                        onClick={() => deleteMutation.mutate(story.id)}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                )}
                            </Group>

                            {story.photo && (
                                <Image src={story.photo} alt={t('photo')} h={180} fit="cover" radius="md" mb="xs" />
                            )}

                            <Text size="sm">{story.text}</Text>
                        </Card>
                    ))}
                </SimpleGrid>
            )}

            <Modal opened={opened} onClose={close} title={t('addStory')}>
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        placeholder={t('storyDescriptionPlaceholder')}
                        rows={3}
                        value={text}
                        onChange={(e) => setText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        accept="image/*"
                        leftSection={<IconPhoto size={16} />}
                        value={photo}
                        onChange={setPhoto}
                        clearable
                        required
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
