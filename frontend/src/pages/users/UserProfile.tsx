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
    Menu,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconEdit,
    IconUserPlus,
    IconMessage,
    IconPhoto,
    IconPlus,
    IconMessageCircle,
    IconTrash,
    IconCheck,
    IconX,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import NotFound from '../../components/NotFound';
import { StoryViewerModal, type UserStoriesGroup } from '../../components/StoryViewerModal';
import {
    userService,
    friendService,
    feedService,
    storyService,
    type UserResource,
    type FeedReactionResource,
} from '../../api/services';
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
import {openConfirmActionModal} from "../../utils/confirmModal.tsx";

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
    const [storyViewerOpened, setStoryViewerOpened] = useState(false);
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
    const [feedFieldErrors, setFeedFieldErrors] = useState<Record<string, string>>({});
    const [storyFieldErrors, setStoryFieldErrors] = useState<Record<string, string>>({});

    // New feed input
    const [feedText, setFeedText] = useState('');
    const [feedPhoto, setFeedPhoto] = useState<File | null>(null);

    // Active comments collapse for feeds
    const [openCommentsFeedId, setOpenCommentsFeedId] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

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
                'include[]': ['feedComments', 'feedReactions'],
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

    const userStoryGroups = useMemo<UserStoriesGroup[]>(() => {
        if (!userStoriesData || userStoriesData.length === 0 || !user) return [];
        const parseTime = (dateStr?: string) => (dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0);
        const sortedStories = [...userStoriesData].sort((a, b) => parseTime(a.createdAt) - parseTime(b.createdAt));
        const newestStory = [...userStoriesData].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt))[0];
        return [
            {
                userId: user.id,
                author: user,
                stories: sortedStories,
                newestStory,
            },
        ];
    }, [userStoriesData, user]);

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
            setEditFieldErrors({});
            notifications.show({ title: t('profile'), message: t('profileUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
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
            notifications.show({ title: t('friend'), message: t('friendRemoved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleRemoveFriend = (friendId: string) => {
        openConfirmActionModal({
            title: t('confirmFriendRemovalTitle'),
            message: t('confirmFriendRemovalMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => removeFriendMutation.mutate(friendId),
        });
    };

    const handleDeleteFeed = (feedId: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteFeedMutation.mutate(feedId),
        });
    };

    const handleDeleteComment = (commentId: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteCommentMutation.mutate(commentId),
        });
    };

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
            setFeedFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedAdded'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFeedFieldErrors(fe);
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
            setStoryFieldErrors({});
            closeStoryModal();
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyAdded'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setStoryFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Delete feed mutation
    const deleteFeedMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteFeed(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Add reaction
    const addReactionMutation = useMutation({
        mutationFn: async ({ feedId, type }: { feedId: string; type: number }) => {
            await feedService.addReaction(feedId, type);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('reactions'), message: t('reactionAdded'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Update reaction
    const updateReactionMutation = useMutation({
        mutationFn: async ({ reactionId, type }: { reactionId: string; type: number }) => {
            await feedService.updateReaction(reactionId, type);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('reactions'), message: t('reactionUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Delete reaction
    const deleteReactionMutation = useMutation({
        mutationFn: async (reactionId: string) => {
            await feedService.deleteReaction(reactionId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('reactions'), message: t('reactionDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Handle reaction click dispatcher
    const handleReaction = (feedId: string, type: number, myReaction?: FeedReactionResource) => {
        if (!myReaction) {
            addReactionMutation.mutate({ feedId, type });
        } else if (myReaction.reaction === type) {
            deleteReactionMutation.mutate(myReaction.id);
        } else {
            updateReactionMutation.mutate({ reactionId: myReaction.id, type });
        }
    };

    // Add comment
    const addCommentMutation = useMutation({
        mutationFn: async ({ feedId, text }: { feedId: string; text: string }) => {
            await feedService.addComment(feedId, text);
        },
        onSuccess: (_data, variables) => {
            setCommentInputs((prev) => ({ ...prev, [variables.feedId]: '' }));
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            notifications.show({ title: t('comments'), message: t('commentAdded'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Update comment
    const updateCommentMutation = useMutation({
        mutationFn: async ({ id, text }: { id: string; text: string }) => {
            await feedService.updateComment(id, { text });
        },
        onSuccess: () => {
            setEditingCommentId(null);
            setEditingCommentText('');
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('comments'), message: t('commentUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Delete comment
    const deleteCommentMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteComment(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('comments'), message: t('commentDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
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
        return <NotFound title={t('userNotFound')} />;
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
                    <Box h={160} bg="var(--mantine-primary-color-filled)" />
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
                                <Tooltip label={t('edit')} withArrow>
                                    <ActionIcon
                                        variant="light"
                                        size={30}
                                        onClick={handleOpenEdit}
                                        aria-label={t('edit')}
                                    >
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            )}

                            {!isOwner && currentUser && (
                                <>
                                    {isFriendAccepted ? (
                                        <Group gap="xs">
                                            <Badge color="green" variant="light">
                                                {t('friends.accepted')}
                                            </Badge>
                                            <Tooltip label={t('delete')} withArrow>
                                                <ActionIcon
                                                    variant="light"
                                                    color="red"
                                                    size={30}
                                                    onClick={() => friendship?.id && handleRemoveFriend(friendship.id)}
                                                    loading={removeFriendMutation.isPending}
                                                    disabled={removeFriendMutation.isPending}
                                                    aria-label={t('delete')}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
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

                                    <Tooltip label={t('chat')} withArrow>
                                        <ActionIcon
                                            component={Link}
                                            to={`/users/${user.link}/conversations`}
                                            variant="light"
                                            size={30}
                                        >
                                            <IconMessage size={16} />
                                        </ActionIcon>
                                    </Tooltip>
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
                                <Avatar radius="xl" size="lg">
                                    <IconPlus size={24} />
                                </Avatar>
                                <Text size="xs" fw={500}>
                                    {t('addStory')}
                                </Text>
                            </Stack>
                        )}

                        {/* Stories of this user grouped */}
                        {userStoryGroups.map((group) => {
                            const storyImg = formatImageSrc(group.newestStory?.photo) || userProfilePhotoSrc;
                            return (
                                <Stack
                                    key={group.userId}
                                    align="center"
                                    gap={4}
                                    className="pointer"
                                    miw={64}
                                    onClick={() => setStoryViewerOpened(true)}
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
                            placeholder={t('whatIsOnYourMind')}
                            required
                            autosize
                            minRows={2}
                            value={feedText}
                            error={feedFieldErrors.text}
                            onChange={(e) => setFeedText(e.currentTarget.value)}
                        />

                        <Group justify="space-between" align="flex-end">
                            <FileInput
                                label={t('photo')}
                                placeholder={t('selectPhoto')}
                                required
                                leftSection={<IconPhoto size={16} />}
                                accept="image/*"
                                size="xs"
                                value={feedPhoto}
                                error={feedFieldErrors.photo}
                                onChange={setFeedPhoto}
                                clearable
                                maw={200}
                            />

                            <Button
                                size="xs"
                                loading={createFeedMutation.isPending}
                                disabled={createFeedMutation.isPending || !feedText.trim() || !feedPhoto}
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
                        const reactionCounts: Record<number, number> = {};
                        feed.reactions?.forEach((r) => {
                            reactionCounts[r.reaction] = (reactionCounts[r.reaction] ?? 0) + 1;
                        });
                        const myReaction = feed.reactions?.find((r) => r.userId === currentUser?.id);

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
                                        <Tooltip label={t('delete')} withArrow>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                size={30}
                                                onClick={() => handleDeleteFeed(feed.id)}
                                                loading={deleteFeedMutation.isPending}
                                                disabled={deleteFeedMutation.isPending}
                                                aria-label={t('delete')}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Tooltip>
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
                                        {/* Reaction Picker Menu */}
                                        <Menu shadow="md" position="top-start" withArrow width="max-content">
                                            <Menu.Target>
                                                <Button
                                                    variant="subtle"
                                                    size="xs"
                                                    color={myReaction ? undefined : 'gray'}
                                                    leftSection={
                                                        <span className="reaction-target-emoji">
                                                            {myReaction
                                                                ? FeedReactionEnum.getEmoji(myReaction.reaction)
                                                                : '👍'}
                                                        </span>
                                                    }
                                                >
                                                    {feed.reactions?.length ?? 0}
                                                </Button>
                                            </Menu.Target>
                                            <Menu.Dropdown className="reaction-menu-dropdown">
                                                <Group className="reaction-menu-group">
                                                    {FeedReactionEnum.ALL_REACTIONS.map((r) => (
                                                        <ActionIcon
                                                            key={r.type}
                                                            variant={
                                                                myReaction?.reaction === r.type ? 'filled' : 'subtle'
                                                            }
                                                            color={myReaction?.reaction === r.type ? undefined : 'gray'}
                                                            size={30}
                                                            className="reaction-action-icon"
                                                            onClick={() => handleReaction(feed.id, r.type, myReaction)}
                                                            title={t(`feedReactions.${r.key}`)}
                                                        >
                                                            <span className="reaction-item-emoji">{r.emoji}</span>
                                                        </ActionIcon>
                                                    ))}
                                                </Group>
                                            </Menu.Dropdown>
                                        </Menu>

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
                                            const canManageComment = currentUser?.id === c.userId || isAdmin;
                                            const isEditing = editingCommentId === c.id;

                                            return (
                                                <Paper key={c.id} p="xs" withBorder radius="sm">
                                                    <Group justify="space-between" mb={2}>
                                                        <Text size="xs" fw={600}>
                                                            {cAuthor
                                                                ? `${cAuthor.firstName ?? ''} ${cAuthor.lastName ?? ''}`.trim() ||
                                                                  c.userId
                                                                : c.userId}
                                                        </Text>
                                                        <Group gap={6}>
                                                            <Text size="xs" c="dimmed">
                                                                {c.createdAt
                                                                    ? new Date(c.createdAt).toLocaleTimeString()
                                                                    : ''}
                                                            </Text>
                                                            {canManageComment && !isEditing && (
                                                                <Group gap={4}>
                                                                    <Tooltip label={t('editComment')} withArrow>
                                                                        <ActionIcon
                                                                            size={30}
                                                                            variant="light"
                                                                            onClick={() => {
                                                                                setEditingCommentId(c.id);
                                                                                setEditingCommentText(c.text);
                                                                            }}
                                                                        >
                                                                            <IconEdit size={16} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                    <Tooltip label={t('deleteComment')} withArrow>
                                                                        <ActionIcon
                                                                            size={30}
                                                                            variant="light"
                                                                            color="red"
                                                                            onClick={() => handleDeleteComment(c.id)}
                                                                            loading={deleteCommentMutation.isPending}
                                                                            disabled={deleteCommentMutation.isPending}
                                                                            aria-label={t('deleteComment')}
                                                                        >
                                                                            <IconTrash size={16} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                </Group>
                                                            )}
                                                        </Group>
                                                    </Group>

                                                    {isEditing ? (
                                                        <Group gap="xs" mt={4}>
                                                            <TextInput
                                                                size="xs"
                                                                flex={1}
                                                                value={editingCommentText}
                                                                onChange={(e) =>
                                                                    setEditingCommentText(e.currentTarget.value)
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (
                                                                        e.key === 'Enter' &&
                                                                        editingCommentText.trim()
                                                                    ) {
                                                                        updateCommentMutation.mutate({
                                                                            id: c.id,
                                                                            text: editingCommentText.trim(),
                                                                        });
                                                                    } else if (e.key === 'Escape') {
                                                                        setEditingCommentId(null);
                                                                    }
                                                                }}
                                                                autoFocus
                                                            />
                                                            <Tooltip label={t('save')} withArrow>
                                                                <ActionIcon
                                                                    size={30}
                                                                    color="green"
                                                                    variant="light"
                                                                    onClick={() =>
                                                                        updateCommentMutation.mutate({
                                                                            id: c.id,
                                                                            text: editingCommentText.trim(),
                                                                        })
                                                                    }
                                                                    disabled={
                                                                        updateCommentMutation.isPending ||
                                                                        !editingCommentText.trim()
                                                                    }
                                                                    loading={updateCommentMutation.isPending}
                                                                >
                                                                    <IconCheck size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                            <Tooltip label={t('cancel')} withArrow>
                                                                <ActionIcon
                                                                    size={30}
                                                                    color="gray"
                                                                    variant="subtle"
                                                                    onClick={() => setEditingCommentId(null)}
                                                                >
                                                                    <IconX size={16} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Group>
                                                    ) : (
                                                        <Text size="xs" className="pre-wrap">
                                                            {c.text}
                                                        </Text>
                                                    )}
                                                </Paper>
                                            );
                                        })}

                                        <Group gap="xs" mt="xs">
                                            <TextInput
                                                aria-label={t('writeComment')}
                                                placeholder={t('writeComment')}
                                                size="xs"
                                                flex={1}
                                                value={commentInputs[feed.id] ?? ''}
                                                onChange={(e) =>
                                                    setCommentInputs((prev) => ({
                                                        ...prev,
                                                        [feed.id]: e.currentTarget.value,
                                                    }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && (commentInputs[feed.id] ?? '').trim()) {
                                                        addCommentMutation.mutate({
                                                            feedId: feed.id,
                                                            text: (commentInputs[feed.id] ?? '').trim(),
                                                        });
                                                    }
                                                }}
                                            />
                                            <Button
                                                size="xs"
                                                loading={addCommentMutation.isPending}
                                                disabled={
                                                    addCommentMutation.isPending ||
                                                    !(commentInputs[feed.id] ?? '').trim()
                                                }
                                                onClick={() =>
                                                    addCommentMutation.mutate({
                                                        feedId: feed.id,
                                                        text: (commentInputs[feed.id] ?? '').trim(),
                                                    })
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
                        error={storyFieldErrors.text}
                        onChange={(e) => setStoryText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhotoPlaceholder')}
                        accept="image/*"
                        value={storyPhoto}
                        error={storyFieldErrors.photo}
                        onChange={setStoryPhoto}
                        clearable
                        required
                    />
                    <Button
                        mt="md"
                        loading={createStoryMutation.isPending}
                        disabled={createStoryMutation.isPending || !storyText.trim() || !storyPhoto}
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
                            required
                            value={formData.firstName}
                            error={editFieldErrors.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('lastName')}
                            required
                            value={formData.lastName}
                            error={editFieldErrors.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('link')}
                            required
                            value={formData.link}
                            error={editFieldErrors.link}
                            onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('phone')}
                            placeholder={t('phonePlaceholder')}
                            required
                            value={formData.phone}
                            error={editFieldErrors.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <TextInput
                        label={t('birthAt')}
                        type="date"
                        required
                        value={formData.birthAt}
                        error={editFieldErrors.birthAt}
                        onChange={(e) => setFormData({ ...formData, birthAt: e.currentTarget.value })}
                    />

                    <Textarea
                        label={t('bio')}
                        required
                        value={formData.bio}
                        error={editFieldErrors.bio}
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
                            error={editFieldErrors.profilePhoto}
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
                            error={editFieldErrors.backgroundPhoto}
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
                            error={editFieldErrors.country}
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
                            error={editFieldErrors.gender}
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
                            error={editFieldErrors.theme}
                            onChange={(val) => setFormData({ ...formData, theme: val })}
                        />
                        <Select
                            label={t('language')}
                            placeholder={t('language')}
                            required
                            clearable
                            data={LanguageEnum.getOptions(t).map((l) => ({ value: String(l.value), label: l.label }))}
                            value={formData.language}
                            error={editFieldErrors.language}
                            onChange={(val) => setFormData({ ...formData, language: val })}
                        />
                        <Select
                            label={t('color')}
                            placeholder={t('color')}
                            required
                            clearable
                            data={ColorEnum.getOptions(t).map((cl) => ({ value: String(cl.value), label: cl.label }))}
                            value={formData.color}
                            error={editFieldErrors.color}
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
                        error={editFieldErrors.roles}
                        onChange={(val) => setFormData({ ...formData, roles: val })}
                    />

                    <MultiSelect
                        label={t('discipline')}
                        placeholder={t('discipline')}
                        clearable
                        data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                        value={formData.disciplines}
                        error={editFieldErrors.disciplines}
                        onChange={(val) => setFormData({ ...formData, disciplines: val })}
                    />

                    <TextInput
                        label={t('newPasswordOptional')}
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        value={formData.password}
                        error={editFieldErrors.password}
                        onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
                    />

                    <Button
                        mt="md"
                        loading={updateMutation.isPending}
                        disabled={
                            updateMutation.isPending ||
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

            {/* Story Viewer Modal */}
            <StoryViewerModal
                opened={storyViewerOpened}
                onClose={() => setStoryViewerOpened(false)}
                groups={userStoryGroups}
            />
        </Stack>
    );
}
