import { useState, useMemo } from 'react';
import {
    Stack,
    Card,
    Avatar,
    Title,
    Text,
    Button,
    Group,
    Badge,
    Box,
    Paper,
    Modal,
    TextInput,
    Textarea,
    Select,
    MultiSelect,
    SimpleGrid,
    FileInput,
    Image,
    ScrollArea,
    Collapse,
    ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconEdit,
    IconUserPlus,
    IconMessage,
    IconPhoto,
    IconPlus,
    IconHeart,
    IconMessageCircle,
    IconTrash,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, friendService, feedService, storyService, type UserResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { CountryEnum } from '../../enums/CountryEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { LanguageEnum } from '../../enums/LanguageEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { ThemeEnum } from '../../enums/ThemeEnum';
import { UserProfileNav } from '../../components/UserProfileNav';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';

export default function UserProfile() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const { currentUser, isAdmin, refetchUser } = useAuth();
    const queryClient = useQueryClient();

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

    // Stories modal
    const [storyOpened, { open: openStoryModal, close: closeStoryModal }] = useDisclosure(false);
    const [storyText, setStoryText] = useState('');
    const [storyPhoto, setStoryPhoto] = useState<File | null>(null);

    // New feed input
    const [feedText, setFeedText] = useState('');
    const [feedPhoto, setFeedPhoto] = useState<File | null>(null);

    // Active comments collapse for feeds
    const [openCommentsFeedId, setOpenCommentsFeedId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    // Fetch user details
    const {
        data: user,
        isLoading: userLoading,
        refetch: refetchProfile,
    } = useQuery({
        queryKey: ['user', link],
        queryFn: async () => {
            if (!link) return null;
            return await userService.getUserByLink(link);
        },
        enabled: !!link,
    });

    const isOwner = currentUser?.id === user?.id;
    const canEdit = isOwner || isAdmin;

    // Check friendship status
    const { data: friendship } = useQuery({
        queryKey: ['friendship', user?.id, currentUser?.id],
        queryFn: async () => {
            if (!user?.id || !currentUser?.id || isOwner) return null;
            const res = await friendService.getFriends({
                filter: { userIds: [user.id] },
                limit: 10,
            });
            const match = res.data?.find(
                (f) =>
                    (f.senderUserId === currentUser.id && f.receiverUserId === user.id) ||
                    (f.senderUserId === user.id && f.receiverUserId === currentUser.id),
            );
            return match ?? null;
        },
        enabled: !!user?.id && !!currentUser?.id && !isOwner,
    });

    // Fetch user feeds
    const { data: userFeedsData, isLoading: feedsLoading } = useQuery({
        queryKey: ['user-profile-feeds', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await feedService.getFeeds({
                filter: { userId: user.id },
                page: 1,
                limit: 30,
                sort: 'createdAt:desc',
            });
            return res.data ?? [];
        },
        enabled: !!user?.id,
    });

    // Fetch user stories
    const { data: userStoriesData } = useQuery({
        queryKey: ['user-profile-stories', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const res = await storyService.getStories({
                filter: { userId: user.id },
                page: 1,
                limit: 20,
                sort: 'createdAt:desc',
            });
            return res.data ?? [];
        },
        enabled: !!user?.id,
    });

    // Collect user IDs from feeds comments
    const commentUserIds = useMemo(() => {
        const ids: string[] = [];
        userFeedsData?.forEach((f) => {
            f.comments?.forEach((c) => ids.push(c.userId));
        });
        return Array.from(new Set(ids));
    }, [userFeedsData]);

    const { data: commentUsersMapData } = useQuery({
        queryKey: ['feed-comment-users', commentUserIds],
        queryFn: async () => {
            if (commentUserIds.length === 0) return {};
            const users = await userService.getUsersByIds(commentUserIds);
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: commentUserIds.length > 0,
    });

    const commentUsersMap = commentUsersMapData ?? {};

    // Form data for editing profile
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        phone: '',
        country: null as string | null,
        gender: null as string | null,
        birthAt: '',
        theme: null as string | null,
        language: null as string | null,
        color: null as string | null,
        link: '',
        password: '',
        disciplines: [] as string[],
        roles: [] as string[],
    });

    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [backgroundPhotoFile, setBackgroundPhotoFile] = useState<File | null>(null);

    const handleOpenEdit = () => {
        if (!user) return;
        setFormData({
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            bio: user.bio ?? '',
            phone: user.phone != null ? String(user.phone) : '',
            country: user.country != null ? String(user.country) : null,
            gender: user.gender != null ? String(user.gender) : null,
            birthAt: user.birthAt ? user.birthAt.split('T')[0] : '',
            theme: user.theme != null ? String(user.theme) : null,
            language: user.language != null ? String(user.language) : null,
            color: user.color != null ? String(user.color) : null,
            link: user.link ?? '',
            password: '',
            disciplines: user.disciplines?.map((d) => String(d.discipline)) ?? [],
            roles: user.roles?.map((r) => String(r.role)) ?? [],
        });
        setProfilePhotoFile(null);
        setBackgroundPhotoFile(null);
        openEdit();
    };

    // Update profile mutation (PUT /api/users/{id})
    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!user) return;

            let profPhoto = user.profilePhoto || '';
            if (profilePhotoFile) {
                profPhoto = await fileToBase64(profilePhotoFile);
            }

            let bgPhoto = user.backgroundPhoto || '';
            if (backgroundPhotoFile) {
                bgPhoto = await fileToBase64(backgroundPhotoFile);
            }

            if (!profPhoto) {
                throw new Error(t('profilePhoto') + ' ' + t('required'));
            }
            if (!bgPhoto) {
                throw new Error(t('backgroundPhoto') + ' ' + t('required'));
            }
            if (!formData.country) {
                throw new Error(t('country') + ' ' + t('required'));
            }
            if (!formData.gender) {
                throw new Error(t('gender') + ' ' + t('required'));
            }
            if (!formData.theme) {
                throw new Error(t('theme') + ' ' + t('required'));
            }
            if (!formData.language) {
                throw new Error(t('language') + ' ' + t('required'));
            }
            if (!formData.color) {
                throw new Error(t('color') + ' ' + t('required'));
            }

            return await userService.updateUser(user.id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                bio: formData.bio,
                phone: Number(formData.phone) || 0,
                country: Number(formData.country) as CountryEnum,
                gender: Number(formData.gender) as GenderEnum,
                birthAt: formData.birthAt,
                theme: Number(formData.theme) as ThemeEnum,
                language: Number(formData.language) as LanguageEnum,
                color: Number(formData.color) as ColorEnum,
                link: formData.link,
                password: formData.password || null,
                email: user.email,
                profilePhoto: profPhoto,
                backgroundPhoto: bgPhoto,
                disciplines: formData.disciplines.map(Number),
                roles: formData.roles.map(Number),
            });
        },
        onSuccess: () => {
            closeEdit();
            queryClient.invalidateQueries({ queryKey: ['user', link] });
            refetchProfile();
            refetchUser();
            notifications.show({ title: t('profile'), message: t('profileUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Friend request mutations
    const sendFriendMutation = useMutation({
        mutationFn: async () => {
            if (!user) return;
            await friendService.sendFriendRequest(user.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friendship'] });
            notifications.show({ title: t('friend'), message: t('friendRequestSent'), color: 'green' });
        },
    });

    const removeFriendMutation = useMutation({
        mutationFn: async (friendId: string) => {
            await friendService.deleteFriend(friendId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friendship'] });
            notifications.show({ title: t('friend'), message: t('friendRemoved'), color: 'blue' });
        },
    });

    // Add feed mutation
    const createFeedMutation = useMutation({
        mutationFn: async () => {
            if (!feedPhoto) throw new Error(t('selectPhoto'));
            const photoStr = await fileToBase64(feedPhoto);
            return await feedService.createFeed({ text: feedText, photo: photoStr });
        },
        onSuccess: () => {
            setFeedText('');
            setFeedPhoto(null);
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedAdded'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Add story mutation
    const createStoryMutation = useMutation({
        mutationFn: async () => {
            if (!storyPhoto) throw new Error(t('selectPhoto'));
            const photoStr = await fileToBase64(storyPhoto);
            return await storyService.createStory({ text: storyText, photo: photoStr });
        },
        onSuccess: () => {
            setStoryText('');
            setStoryPhoto(null);
            closeStoryModal();
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyAdded'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Delete feed mutation
    const deleteFeedMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteFeed(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedDeleted'), color: 'blue' });
        },
    });

    // Add reaction
    const addReactionMutation = useMutation({
        mutationFn: async ({ feedId, type }: { feedId: string; type: number }) => {
            await feedService.addReaction(feedId, type);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', user?.id] });
        },
    });

    // Add comment
    const addCommentMutation = useMutation({
        mutationFn: async ({ feedId, text }: { feedId: string; text: string }) => {
            await feedService.addComment(feedId, text);
        },
        onSuccess: () => {
            setCommentText('');
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', user?.id] });
            notifications.show({ title: t('comments'), message: t('commentAdded'), color: 'green' });
        },
    });

    if (userLoading) {
        return (
            <Text ta="center" py="xl">
                {t('loadingProfile')}
            </Text>
        );
    }

    if (!user) {
        return (
            <Paper withBorder p="xl" radius="md" ta="center">
                <Text c="dimmed">{t('userNotFound')}</Text>
            </Paper>
        );
    }

    const isFriendAccepted = friendship?.status === FriendStatusEnum.ACCEPTED;
    const isFriendPending = friendship?.status === FriendStatusEnum.PENDING;

    const hasProfilePhoto = !!(profilePhotoFile || user.profilePhoto);
    const hasBgPhoto = !!(backgroundPhotoFile || user.backgroundPhoto);

    const userProfilePhotoSrc = formatImageSrc(user.profilePhoto);
    const userBgPhotoSrc = formatImageSrc(user.backgroundPhoto);

    return (
        <Stack gap="lg">
            {/* Full Profile Header Card */}
            <Card withBorder radius="md" p={0} shadow="xs" className="overflow-hidden">
                {userBgPhotoSrc ? (
                    <Image src={userBgPhotoSrc} h={160} fit="cover" alt={user.firstName} />
                ) : (
                    <Box h={160} bg="blue.7" />
                )}

                <Box p="md" pos="relative">
                    <Avatar
                        src={userProfilePhotoSrc}
                        size={100}
                        radius={100}
                        pos="absolute"
                        top={-50}
                        left={24}
                        className="profile-avatar-border"
                    >
                        ?
                    </Avatar>

                    <Group justify="space-between" align="flex-start" mt={55}>
                        <div>
                            <Title order={2}>
                                {user.firstName} {user.lastName}
                            </Title>
                            <Text size="sm" c="dimmed">
                                @{user.link}
                            </Text>
                        </div>

                        <Group gap="xs">
                            {canEdit && (
                                <Button
                                    leftSection={<IconEdit size={16} />}
                                    variant="default"
                                    size="xs"
                                    onClick={handleOpenEdit}
                                >
                                    {t('edit')}
                                </Button>
                            )}

                            {!isOwner && currentUser && (
                                <>
                                    {isFriendAccepted ? (
                                        <Group gap="xs">
                                            <Badge color="green" variant="light">
                                                {t('friends.accepted')}
                                            </Badge>
                                            <Button
                                                variant="subtle"
                                                color="red"
                                                size="xs"
                                                onClick={() =>
                                                    friendship?.id && removeFriendMutation.mutate(friendship.id)
                                                }
                                            >
                                                {t('delete')}
                                            </Button>
                                        </Group>
                                    ) : isFriendPending ? (
                                        <Badge color="yellow" variant="light">
                                            {t('friends.pending')}
                                        </Badge>
                                    ) : (
                                        <Button
                                            leftSection={<IconUserPlus size={16} />}
                                            size="xs"
                                            onClick={() => sendFriendMutation.mutate()}
                                            loading={sendFriendMutation.isPending}
                                        >
                                            {t('addFriend')}
                                        </Button>
                                    )}

                                    <Button
                                        component={Link}
                                        to={`/users/${user.link}/conversations`}
                                        variant="light"
                                        size="xs"
                                        leftSection={<IconMessage size={16} />}
                                    >
                                        {t('chat')}
                                    </Button>
                                </>
                            )}
                        </Group>
                    </Group>

                    {user.bio && (
                        <Text size="sm" mt="sm" className="pre-wrap">
                            {user.bio}
                        </Text>
                    )}

                    <Group gap="xs" mt="md">
                        {user.roles?.map((r) => (
                            <Badge key={r.id} color="blue">
                                {r.role === RoleEnum.ADMINISTRATOR
                                    ? t('roles.administrator')
                                    : r.role === RoleEnum.ORGANIZER
                                      ? t('roles.organizer')
                                      : t('roles.participant')}
                            </Badge>
                        ))}
                        {user.disciplines?.map((d) => (
                            <Badge key={d.id} color="cyan" variant="outline">
                                {DisciplineEnum.getOptions(t).find((o) => o.value === d.discipline)?.label ??
                                    d.discipline}
                            </Badge>
                        ))}
                    </Group>
                </Box>
            </Card>

            {/* Profile subpages navigation tabs */}
            <UserProfileNav user={user} isOwner={isOwner} simplifiedHeader={false} />

            {/* Reels / Stories horizontal carousel */}
            <Card withBorder radius="md" p="sm" shadow="xs">
                <ScrollArea type="never">
                    <Group gap="md" wrap="nowrap">
                        {/* Add Story Button (if owner or admin) */}
                        {canEdit && (
                            <Stack align="center" gap={4} className="pointer" onClick={openStoryModal}>
                                <Avatar radius="xl" size="lg" color="blue">
                                    <IconPlus size={24} />
                                </Avatar>
                                <Text size="xs" fw={500}>
                                    {t('addStory')}
                                </Text>
                            </Stack>
                        )}

                        {/* Stories of this user */}
                        {userStoriesData?.map((story) => {
                            const storyImg = formatImageSrc(story.photo) || userProfilePhotoSrc;
                            return (
                                <Stack
                                    key={story.id}
                                    align="center"
                                    gap={4}
                                    className="pointer"
                                    miw={64}
                                    onClick={() => {
                                        notifications.show({
                                            title: user.firstName ?? t('stories'),
                                            message: story.text || '',
                                            color: 'blue',
                                        });
                                    }}
                                >
                                    <Avatar src={storyImg} radius="xl" size="lg" className="story-avatar-border">
                                        ?
                                    </Avatar>
                                    <Text size="xs" lineClamp={1}>
                                        {user.firstName}
                                    </Text>
                                </Stack>
                            );
                        })}

                        {!canEdit && userStoriesData?.length === 0 && (
                            <Text size="xs" c="dimmed" py="xs">
                                {t('noRecords')}
                            </Text>
                        )}
                    </Group>
                </ScrollArea>
            </Card>

            {/* Add new Feed box (if owner or admin) */}
            {canEdit && (
                <Paper withBorder radius="md" p="md" shadow="xs">
                    <Stack gap="sm">
                        <Textarea
                            label={t('feeds')}
                            required
                            placeholder={t('whatIsOnYourMind')}
                            autosize
                            minRows={2}
                            value={feedText}
                            onChange={(e) => setFeedText(e.currentTarget.value)}
                        />

                        <Group justify="space-between" align="flex-end">
                            <FileInput
                                label={t('photo')}
                                required
                                leftSection={<IconPhoto size={16} />}
                                placeholder={t('selectPhoto')}
                                accept="image/*"
                                size="xs"
                                value={feedPhoto}
                                onChange={setFeedPhoto}
                                clearable
                                maw={200}
                            />

                            <Button
                                size="xs"
                                loading={createFeedMutation.isPending}
                                disabled={!feedText.trim() || !feedPhoto}
                                onClick={() => createFeedMutation.mutate()}
                            >
                                {t('send')}
                            </Button>
                        </Group>
                    </Stack>
                </Paper>
            )}

            {/* Feeds stream */}
            <Stack gap="md">
                {feedsLoading ? (
                    <Text ta="center" c="dimmed">
                        {t('loadingFeeds')}
                    </Text>
                ) : userFeedsData?.length === 0 ? (
                    <Paper withBorder p="xl" radius="md" ta="center">
                        <Text c="dimmed">{t('noMoreFeeds')}</Text>
                    </Paper>
                ) : (
                    userFeedsData?.map((feed) => {
                        const commentsOpen = openCommentsFeedId === feed.id;

                        return (
                            <Card key={feed.id} withBorder radius="md" shadow="xs" p="md">
                                {/* Header */}
                                <Group justify="space-between" mb="xs">
                                    <Group gap="sm">
                                        <Avatar src={userProfilePhotoSrc} radius="xl">
                                            ?
                                        </Avatar>
                                        <Box>
                                            <Text size="sm" fw={600}>
                                                {user.firstName} {user.lastName}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {feed.createdAt ? new Date(feed.createdAt).toLocaleString() : ''}
                                            </Text>
                                        </Box>
                                    </Group>

                                    {canEdit && (
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="sm"
                                            onClick={() => deleteFeedMutation.mutate(feed.id)}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    )}
                                </Group>

                                {/* Content */}
                                <Text size="sm" mb="sm" className="pre-wrap">
                                    {feed.text}
                                </Text>

                                {feed.photo && (
                                    <Image
                                        src={formatImageSrc(feed.photo)}
                                        alt={t('photo')}
                                        mah={400}
                                        fit="cover"
                                        radius="md"
                                        mb="sm"
                                    />
                                )}

                                {/* Actions & stats */}
                                <Group justify="space-between" mt="xs">
                                    <Group gap="xs">
                                        <Button
                                            variant="subtle"
                                            size="xs"
                                            color="red"
                                            leftSection={<IconHeart size={16} />}
                                            onClick={() =>
                                                addReactionMutation.mutate({
                                                    feedId: feed.id,
                                                    type: FeedReactionEnum.LIKE,
                                                })
                                            }
                                        >
                                            {feed.reactions?.length ?? 0}
                                        </Button>

                                        <Button
                                            variant="subtle"
                                            size="xs"
                                            color="gray"
                                            leftSection={<IconMessageCircle size={16} />}
                                            onClick={() => setOpenCommentsFeedId(commentsOpen ? null : feed.id)}
                                        >
                                            {feed.comments?.length ?? 0}
                                        </Button>
                                    </Group>
                                </Group>

                                {/* Comments section */}
                                <Collapse expanded={commentsOpen}>
                                    <Stack gap="xs" mt="sm">
                                        {feed.comments?.map((c) => {
                                            const cAuthor = commentUsersMap[c.userId];
                                            return (
                                                <Paper key={c.id} p="xs" withBorder radius="sm">
                                                    <Group justify="space-between" mb={2}>
                                                        <Text size="xs" fw={600}>
                                                            {cAuthor
                                                                ? `${cAuthor.firstName} ${cAuthor.lastName}`
                                                                : c.userId}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            {c.createdAt
                                                                ? new Date(c.createdAt).toLocaleTimeString()
                                                                : ''}
                                                        </Text>
                                                    </Group>
                                                    <Text size="xs">{c.text}</Text>
                                                </Paper>
                                            );
                                        })}

                                        <Group gap="xs" mt="xs">
                                            <TextInput
                                                placeholder={t('writeComment')}
                                                size="xs"
                                                flex={1}
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.currentTarget.value)}
                                            />
                                            <Button
                                                size="xs"
                                                loading={addCommentMutation.isPending}
                                                disabled={!commentText.trim()}
                                                onClick={() =>
                                                    addCommentMutation.mutate({ feedId: feed.id, text: commentText })
                                                }
                                            >
                                                {t('send')}
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Collapse>
                            </Card>
                        );
                    })
                )}
            </Stack>

            {/* Story Creation Modal */}
            <Modal opened={storyOpened} onClose={closeStoryModal} title={t('addStory')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        placeholder={t('storyDescriptionPlaceholder')}
                        value={storyText}
                        onChange={(e) => setStoryText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        accept="image/*"
                        value={storyPhoto}
                        onChange={setStoryPhoto}
                        clearable
                        required
                    />
                    <Button
                        mt="md"
                        loading={createStoryMutation.isPending}
                        disabled={!storyText.trim() || !storyPhoto}
                        onClick={() => createStoryMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            {/* Edit User Modal - all fields visible, none hidden */}
            <Modal opened={editOpened} onClose={closeEdit} title={t('edit')} size="lg">
                <Stack gap="sm">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('firstName')}
                            placeholder={t('firstName')}
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('lastName')}
                            placeholder={t('lastName')}
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('link')}
                            placeholder={t('link')}
                            required
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('phone')}
                            placeholder="123456789"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <TextInput
                        label={t('birthAt')}
                        type="date"
                        required
                        value={formData.birthAt}
                        onChange={(e) => setFormData({ ...formData, birthAt: e.currentTarget.value })}
                    />

                    <Textarea
                        label={t('bio')}
                        placeholder={t('bio')}
                        required
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.currentTarget.value })}
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <FileInput
                            label={t('profilePhoto')}
                            placeholder={t('selectPhotoPlaceholder')}
                            accept="image/*"
                            leftSection={<IconPhoto size={16} />}
                            value={profilePhotoFile}
                            onChange={setProfilePhotoFile}
                            clearable
                            required
                        />
                        <FileInput
                            label={t('backgroundPhoto')}
                            placeholder={t('selectPhotoPlaceholder')}
                            accept="image/*"
                            leftSection={<IconPhoto size={16} />}
                            value={backgroundPhotoFile}
                            onChange={setBackgroundPhotoFile}
                            clearable
                            required
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <Select
                            label={t('country')}
                            placeholder={t('country')}
                            required
                            clearable
                            data={CountryEnum.getOptions(t).map((c) => ({ value: String(c.value), label: c.label }))}
                            value={formData.country}
                            onChange={(val) => setFormData({ ...formData, country: val })}
                            searchable
                        />
                        <Select
                            label={t('gender')}
                            placeholder={t('gender')}
                            required
                            clearable
                            data={GenderEnum.getOptions(t).map((g) => ({ value: String(g.value), label: g.label }))}
                            value={formData.gender}
                            onChange={(val) => setFormData({ ...formData, gender: val })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                        <Select
                            label={t('theme')}
                            placeholder={t('theme')}
                            required
                            clearable
                            data={ThemeEnum.getOptions(t).map((th) => ({ value: String(th.value), label: th.label }))}
                            value={formData.theme}
                            onChange={(val) => setFormData({ ...formData, theme: val })}
                        />
                        <Select
                            label={t('language')}
                            placeholder={t('language')}
                            required
                            clearable
                            data={LanguageEnum.getOptions(t).map((l) => ({ value: String(l.value), label: l.label }))}
                            value={formData.language}
                            onChange={(val) => setFormData({ ...formData, language: val })}
                        />
                        <Select
                            label={t('color')}
                            placeholder={t('color')}
                            required
                            clearable
                            data={ColorEnum.getOptions(t).map((cl) => ({ value: String(cl.value), label: cl.label }))}
                            value={formData.color}
                            onChange={(val) => setFormData({ ...formData, color: val })}
                        />
                    </SimpleGrid>

                    <MultiSelect
                        label={t('role')}
                        placeholder={t('role')}
                        required
                        clearable
                        data={RoleEnum.getOptions(t).map((r) => ({ value: String(r.value), label: r.label }))}
                        value={formData.roles}
                        onChange={(val) => setFormData({ ...formData, roles: val })}
                    />

                    <MultiSelect
                        label={t('discipline')}
                        placeholder={t('discipline')}
                        clearable
                        data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                        value={formData.disciplines}
                        onChange={(val) => setFormData({ ...formData, disciplines: val })}
                    />

                    <TextInput
                        label={t('newPasswordOptional')}
                        type="password"
                        placeholder={t('passwordOptional')}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
                    />

                    <Button
                        mt="md"
                        loading={updateMutation.isPending}
                        disabled={
                            !formData.firstName.trim() ||
                            !formData.lastName.trim() ||
                            !formData.link.trim() ||
                            !formData.birthAt ||
                            !formData.phone.trim() ||
                            !formData.bio.trim() ||
                            !formData.country ||
                            !formData.gender ||
                            !formData.theme ||
                            !formData.language ||
                            !formData.color ||
                            !hasProfilePhoto ||
                            !hasBgPhoto ||
                            formData.roles.length === 0
                        }
                        onClick={() => updateMutation.mutate()}
                    >
                        {t('saveChanges')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
