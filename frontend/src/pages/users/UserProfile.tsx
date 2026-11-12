import { useState, useMemo, useRef, useCallback } from 'react';
import { Stack, Title, Text, Button, Group, Badge, Center, Loader, Card, Skeleton } from '@mantine/core';
import { IconUserPlus, IconUserMinus, IconUserCheck, IconUserX } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
    userService,
    friendService,
    feedService,
    storyService,
    type FeedResource,
    type StoryResource,
} from '../../api/services';
import { useAuth } from '../../auth';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import {
    NotFound,
    EmptyState,
    StoryViewerModal,
    type UserStoriesGroup,
    UserProfileNav,
    EntityViewCounter,
    StatusActionMenu,
    HeaderBannerWithAvatar,
    EditActionButton,
    DeleteActionButton,
    UserFormModal,
    FeedCard,
    FeedModal,
    StoryModal,
    StoriesBar,
} from '../../components';
import { formatImageSrc, confirmDelete, notifySuccess, notifyError } from '../../utils';
import { useInfiniteScrollObserver, useUsersMap } from '../../hooks';
import { runWhenOnline } from '../../hooks';

export default function UserProfile() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const { currentUser, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [editUserOpened, setEditUserOpened] = useState(false);
    const [storyModalOpened, setStoryModalOpened] = useState(false);
    const [feedModalOpened, setFeedModalOpened] = useState(false);

    const [editingStory, setEditingStory] = useState<StoryResource | null>(null);
    const [updatedStoryForModal, setUpdatedStoryForModal] = useState<StoryResource | null>(null);
    const [editingFeed, setEditingFeed] = useState<FeedResource | null>(null);
    const [storyViewerOpened, setStoryViewerOpened] = useState(false);

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: async () => {
            if (!link) return null;
            const res = await userService.getUsers({
                params: {
                    query: {
                        filter: { link, userIds: null },
                        'include[]': ['userDisciplines', 'userRoles'],
                        limit: 1,
                    },
                },
            });
            return res.data?.[0] ?? null;
        },
        enabled: !!link,
    });

    const isOwner = currentUser?.id === user?.id;
    const primaryColor = ColorEnum.getMantineColor(user?.color);

    const { data: friendship, refetch: refetchFriendship } = useQuery({
        queryKey: ['friendship', user?.id, currentUser?.id],
        queryFn: async () => {
            if (!user?.id || !currentUser?.id || isOwner) return null;
            const res = await friendService.getFriends({
                params: {
                    query: {
                        filter: { userIds: [currentUser.id, user.id] },
                        limit: 10,
                    },
                },
            });
            return (
                res.data?.find(
                    (f) =>
                        (f.senderUserId === currentUser.id && f.receiverUserId === user.id) ||
                        (f.senderUserId === user.id && f.receiverUserId === currentUser.id),
                ) ?? null
            );
        },
        enabled: !!user?.id && !!currentUser?.id && !isOwner,
    });

    const isFriend = friendship?.status === FriendStatusEnum.ACCEPTED;
    const canViewPrivateContent = isOwner || isAdmin || isFriend;

    const {
        data: userFeedsInfiniteData,
        isLoading: feedsLoading,
        fetchNextPage: fetchNextFeedsPage,
        hasNextPage: hasMoreFeeds,
        isFetchingNextPage: isFetchingMoreFeeds,
    } = useInfiniteQuery({
        queryKey: ['user-profile-feeds', user?.id],
        queryFn: async ({ pageParam = 1 }) => {
            if (!user?.id) return { data: [], pagination: null };
            return await feedService.getFeeds({
                params: {
                    query: {
                        filter: { userId: user.id },
                        page: pageParam,
                        limit: 10,
                        sort: 'createdAt:desc',
                        'include[]': ['feedComments', 'feedReactions', 'feedOrigin'],
                    },
                },
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.pagination?.hasNextPage && lastPage.pagination.page ? lastPage.pagination.page + 1 : undefined,
        enabled: !!user?.id && canViewPrivateContent,
    });

    const userFeedsData = useMemo(() => {
        const list = userFeedsInfiniteData?.pages.flatMap((page) => page.data ?? []) ?? [];
        const parseTime = (dateStr?: string) => (dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0);
        return [...list].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
    }, [userFeedsInfiniteData]);

    const lastFeedElementRef = useInfiniteScrollObserver({
        isLoading: isFetchingMoreFeeds,
        hasNextPage: hasMoreFeeds,
        fetchNextPage: fetchNextFeedsPage,
    });

    const relatedUserIds = useMemo(() => {
        const ids = new Set<string>();
        userFeedsData.forEach((f) => {
            if (f.userId) ids.add(f.userId);
            f.comments?.forEach((c) => c.userId && ids.add(c.userId));
            f.reactions?.forEach((r) => r.userId && ids.add(r.userId));
        });
        return Array.from(ids);
    }, [userFeedsData]);

    const { usersMap, isLoading: usersMapLoading } = useUsersMap(relatedUserIds);
    const isProfileFeedsLoading = feedsLoading || (relatedUserIds.length > 0 && usersMapLoading);

    const allUsersMap = useMemo(() => {
        if (!user) return usersMap;
        return { [user.id]: user, ...usersMap };
    }, [user, usersMap]);

    const {
        data: userStoriesInfiniteData,
        isLoading: userStoriesLoading,
        fetchNextPage: fetchNextStoriesPage,
        hasNextPage: hasMoreStories,
        isFetchingNextPage: isFetchingMoreStories,
    } = useInfiniteQuery({
        queryKey: ['user-profile-stories', user?.id],
        queryFn: async ({ pageParam = 1 }) => {
            if (!user?.id) return { data: [], pagination: null };
            return await storyService.getStories({
                params: {
                    query: {
                        filter: { userId: user.id },
                        page: pageParam,
                        limit: 10,
                        sort: 'createdAt:desc',
                    },
                },
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.pagination?.hasNextPage && lastPage.pagination.page ? lastPage.pagination.page + 1 : undefined,
        enabled: !!user?.id && canViewPrivateContent,
    });

    const userStoriesData = useMemo(
        () => userStoriesInfiniteData?.pages.flatMap((page) => page.data ?? []) ?? [],
        [userStoriesInfiniteData],
    );

    const storiesViewportRef = useRef<HTMLDivElement>(null);
    const handleStoriesScroll = useCallback(
        (position: { x: number; y: number }) => {
            const el = storiesViewportRef.current;
            if (!el || isFetchingMoreStories || !hasMoreStories) return;
            const scrollRight = el.scrollWidth - el.clientWidth - position.x;
            if (scrollRight < 100) {
                runWhenOnline(() => void fetchNextStoriesPage());
            }
        },
        [isFetchingMoreStories, hasMoreStories, fetchNextStoriesPage],
    );

    const lastStoryElementRef = useInfiniteScrollObserver({
        isLoading: isFetchingMoreStories,
        hasNextPage: hasMoreStories,
        fetchNextPage: fetchNextStoriesPage,
        root: storiesViewportRef.current,
    });

    const userStoryGroups = useMemo<UserStoriesGroup[]>(() => {
        if (!user || !userStoriesData || userStoriesData.length === 0) return [];
        const parseTime = (dateStr?: string) => (dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0);
        const sorted = [...userStoriesData].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
        const newest = sorted[0];

        return [
            {
                userId: user.id,
                author: user,
                stories: sorted,
                newestStory: newest,
            },
        ];
    }, [user, userStoriesData]);

    const sendFriendMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id || !currentUser?.id) return;
            const res = await friendService.getFriends({
                params: {
                    query: {
                        filter: { userIds: [currentUser.id, user.id] },
                        limit: 10,
                    },
                },
            });
            const existing = res.data?.find(
                (f) =>
                    (f.senderUserId === currentUser.id && f.receiverUserId === user.id) ||
                    (f.senderUserId === user.id && f.receiverUserId === currentUser.id),
            );

            if (existing) {
                if (existing.status === FriendStatusEnum.REJECTED) {
                    await friendService.updateFriendStatus({
                        params: { path: { id: existing.id } },
                        body: { status: FriendStatusEnum.PENDING },
                    });
                }
                return;
            }

            await friendService.createFriend({
                body: { userId: user.id },
            });
        },
        onSuccess: () => {
            void refetchFriendship();
            void queryClient.invalidateQueries({ queryKey: ['friends'] });
            notifySuccess(t('saved'), t('friends'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const updateFriendStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: FriendStatusEnum }) =>
            friendService.updateFriendStatus({
                params: { path: { id } },
                body: { status: status },
            }),
        onSuccess: () => {
            void refetchFriendship();
            void queryClient.invalidateQueries({ queryKey: ['friends'] });
            notifySuccess(t('statusUpdated'), t('friends'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteFriendMutation = useMutation({
        mutationFn: (id: string) => friendService.deleteFriend({ params: { path: { id } } }),
        onSuccess: () => {
            void refetchFriendship();
            notifySuccess(t('deleted'), t('friends'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const updateUserStatusMutation = useMutation({
        mutationFn: async (status: UserStatusEnum) => {
            if (!user?.id) return;
            await userService.updateUserStatus({
                params: { path: { id: user.id } },
                body: { status },
            });
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['user', link] });
            void queryClient.invalidateQueries({ queryKey: ['users'] });
            notifySuccess(t('statusUpdated'), t('users'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteUserMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) return;
            await userService.deleteUser({ params: { path: { id: user.id } } });
        },
        onSuccess: async () => {
            notifySuccess(t('deleted'), t('users'));
            logout();
            void navigate('/sign');
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteStoryMutation = useMutation({
        mutationFn: (id: string) => storyService.deleteStory({ params: { path: { id } } }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['user-profile-stories', user?.id] });
            void queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifySuccess(t('deleted'), t('stories'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    const deleteFeedMutation = useMutation({
        mutationFn: (id: string) => feedService.deleteFeed({ params: { path: { id } } }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', user?.id] });
            void queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifySuccess(t('deleted'), t('feeds'));
        },
        onError: (err) => notifyError(err, t('error')),
    });

    if (userLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!user) {
        return <NotFound title={t('notFound')} />;
    }

    const userProfilePhotoSrc = formatImageSrc(user.profilePhoto);
    const userBgPhotoSrc = formatImageSrc(user.backgroundPhoto);

    const profileHeader = (
        <HeaderBannerWithAvatar
            backgroundPhotoSrc={userBgPhotoSrc}
            profilePhotoSrc={userProfilePhotoSrc}
            altText={user.firstName}
        >
            <Group justify="space-between" align="flex-start" mt={55}>
                <div>
                    <Title order={2}>
                        {user.firstName} {user.lastName}
                    </Title>
                    <Group gap="xs" align="center" mt={2}>
                        <Text size="sm" c="dimmed">
                            @{user.link}
                        </Text>
                        <Text size="sm" c="dimmed">
                            •
                        </Text>
                        <EntityViewCounter entityId={user.id} type={EntryTypeEnum.USER} />
                    </Group>
                </div>

                <Group gap="xs">
                    {isAdmin && (
                        <StatusActionMenu
                            value={user.status}
                            enumType={UserStatusEnum}
                            onChange={(st) => updateUserStatusMutation.mutate(st)}
                            loading={updateUserStatusMutation.isPending}
                        />
                    )}

                    {isOwner && (
                        <>
                            <EditActionButton onClick={() => setEditUserOpened(true)} />
                            <DeleteActionButton
                                onClick={() => confirmDelete(t, () => deleteUserMutation.mutate())}
                                loading={deleteUserMutation.isPending}
                            />
                        </>
                    )}

                    {!isOwner && currentUser && (
                        <Group gap="xs">
                            {(!friendship || friendship.status === FriendStatusEnum.REJECTED) && (
                                <Button
                                    size="xs"
                                    leftSection={<IconUserPlus size={16} />}
                                    onClick={() => sendFriendMutation.mutate()}
                                    loading={sendFriendMutation.isPending}
                                    disabled={sendFriendMutation.isPending}
                                >
                                    {t('addFriend')}
                                </Button>
                            )}

                            {friendship && friendship.status === FriendStatusEnum.ACCEPTED && (
                                <Button
                                    variant="default"
                                    size="xs"
                                    leftSection={<IconUserMinus size={16} />}
                                    onClick={() =>
                                        confirmDelete(
                                            t,
                                            () =>
                                                updateFriendStatusMutation.mutate({
                                                    id: friendship.id,
                                                    status: FriendStatusEnum.REJECTED,
                                                }),
                                            {
                                                title: t('confirmFriendRemovalTitle'),
                                                message: t('confirmFriendRemovalMessage'),
                                            },
                                        )
                                    }
                                    loading={updateFriendStatusMutation.isPending}
                                    disabled={updateFriendStatusMutation.isPending}
                                >
                                    {`${t('delete')} ${t('friendship').toLowerCase()}`}
                                </Button>
                            )}

                            {friendship &&
                                friendship.status === FriendStatusEnum.PENDING &&
                                (friendship.senderUserId === currentUser.id ? (
                                    <Button
                                        variant="default"
                                        size="xs"
                                        leftSection={<IconUserX size={16} />}
                                        onClick={() => deleteFriendMutation.mutate(friendship.id)}
                                        loading={deleteFriendMutation.isPending}
                                        disabled={deleteFriendMutation.isPending}
                                    >
                                        {t('cancelFriendRequest')}
                                    </Button>
                                ) : (
                                    <Group gap="xs">
                                        <Button
                                            size="xs"
                                            color="green"
                                            leftSection={<IconUserCheck size={16} />}
                                            onClick={() =>
                                                updateFriendStatusMutation.mutate({
                                                    id: friendship.id,
                                                    status: FriendStatusEnum.ACCEPTED,
                                                })
                                            }
                                            loading={updateFriendStatusMutation.isPending}
                                            disabled={updateFriendStatusMutation.isPending}
                                        >
                                            {t('acceptFriend')}
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="default"
                                            leftSection={<IconUserX size={16} />}
                                            onClick={() =>
                                                updateFriendStatusMutation.mutate({
                                                    id: friendship.id,
                                                    status: FriendStatusEnum.REJECTED,
                                                })
                                            }
                                            loading={updateFriendStatusMutation.isPending}
                                            disabled={updateFriendStatusMutation.isPending}
                                        >
                                            {t('rejectFriend')}
                                        </Button>
                                    </Group>
                                ))}
                        </Group>
                    )}
                </Group>
            </Group>

            {user.bio && (
                <Text size="sm" mt="sm" className="pre-wrap">
                    {user.bio}
                </Text>
            )}

            <Group gap="xs" mt="md">
                {user.roles?.map((r) => {
                    if (!r) return null;
                    const label =
                        RoleEnum.getOptions(t).find((o) => Number(o.value) === Number(r.role))?.label ??
                        (r.role === RoleEnum.ADMINISTRATOR
                            ? t('roleTypes.administrator')
                            : r.role === RoleEnum.ORGANIZER
                              ? t('roleTypes.organizer')
                              : t('roleTypes.participant'));
                    return (
                        <Badge key={r.id || r.role} color={primaryColor} variant="outline">
                            {label}
                        </Badge>
                    );
                })}
                {user.disciplines?.map((d) => {
                    if (!d) return null;
                    const label =
                        DisciplineEnum.getOptions(t).find((o) => Number(o.value) === Number(d.discipline))?.label ??
                        d.discipline;
                    return <Badge key={d.id || d.discipline}>{label}</Badge>;
                })}
            </Group>
        </HeaderBannerWithAvatar>
    );

    return (
        <Stack>
            <UserProfileNav user={user} isOwner={isOwner} simplifiedHeader={false} profileHeader={profileHeader} />

            {canViewPrivateContent && (
                <>
                    {(isOwner || userStoriesData?.length > 0 || userStoriesLoading) && (
                        <StoriesBar
                            groups={userStoryGroups}
                            isLoading={userStoriesLoading}
                            onSelectGroup={() => setStoryViewerOpened(true)}
                            onAddStory={isOwner ? () => setStoryModalOpened(true) : undefined}
                            onAddFeed={isOwner ? () => setFeedModalOpened(true) : undefined}
                            isFetchingMore={isFetchingMoreStories}
                            viewportRef={storiesViewportRef}
                            onScrollPositionChange={handleStoriesScroll}
                            lastStoryElementRef={lastStoryElementRef}
                        />
                    )}

                    <Stack>
                        {isProfileFeedsLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i}>
                                    <Group mb="sm">
                                        <Skeleton height={40} circle />
                                        <Stack gap={6} flex={1}>
                                            <Skeleton height={14} width="40%" />
                                            <Skeleton height={10} width="20%" />
                                        </Stack>
                                    </Group>
                                    <Skeleton height={50} mb="sm" />
                                    <Skeleton height={180} radius="md" />
                                </Card>
                            ))
                        ) : userFeedsData?.length === 0 ? (
                            <EmptyState title={t('noData')} />
                        ) : (
                            userFeedsData?.map((feed, idx) => (
                                <FeedCard
                                    key={feed.id}
                                    feed={feed}
                                    author={allUsersMap[feed.userId] ?? user}
                                    usersMap={allUsersMap}
                                    onEditFeed={isOwner ? (f: FeedResource) => setEditingFeed(f) : undefined}
                                    onDeleteFeed={
                                        isOwner
                                            ? (id: string) => confirmDelete(t, () => deleteFeedMutation.mutate(id))
                                            : undefined
                                    }
                                    domRef={idx === userFeedsData.length - 1 ? lastFeedElementRef : undefined}
                                />
                            ))
                        )}

                        {isFetchingMoreFeeds && (
                            <Center py="sm">
                                <Loader size="sm" />
                            </Center>
                        )}
                    </Stack>
                </>
            )}

            <UserFormModal opened={editUserOpened} user={user} onClose={() => setEditUserOpened(false)} />

            <StoryModal opened={storyModalOpened} onClose={() => setStoryModalOpened(false)} />

            <StoryModal
                opened={!!editingStory}
                story={editingStory}
                onClose={() => setEditingStory(null)}
                onSuccess={(updated?: StoryResource) => {
                    if (updated) setUpdatedStoryForModal(updated);
                }}
            />

            <FeedModal opened={feedModalOpened} onClose={() => setFeedModalOpened(false)} />

            <FeedModal opened={!!editingFeed} feed={editingFeed} onClose={() => setEditingFeed(null)} />

            <StoryViewerModal
                opened={storyViewerOpened}
                onClose={() => setStoryViewerOpened(false)}
                groups={userStoryGroups}
                initialGroupIndex={0}
                onEdit={isOwner ? (story) => setEditingStory(story) : undefined}
                onDelete={isOwner ? (id) => deleteStoryMutation.mutate(id) : undefined}
                updatedStory={updatedStoryForModal}
            />
        </Stack>
    );
}
