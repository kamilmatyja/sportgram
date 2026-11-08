import { useState, useMemo, useRef, useCallback } from 'react';
import { Stack, Title, Text, Button, Group, Badge, Center, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUserPlus, IconUserMinus, IconUserCheck, IconUserX } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import NotFound from '../../components/NotFound';
import { EmptyState } from '../../components/EmptyState';
import { StoryViewerModal, type UserStoriesGroup } from '../../components/StoryViewerModal';
import {
    userService,
    friendService,
    feedService,
    storyService,
    type FeedResource,
    type StoryResource,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { UserProfileNav } from '../../components/UserProfileNav';
import { EntityViewCounter } from '../../components/EntityViewCounter';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { formatImageSrc } from '../../utils/imageUtils';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { HeaderBannerWithAvatar } from '../../components/common/HeaderBannerWithAvatar';
import { EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { UserFormModal } from '../../components/user/UserFormModal';
import { FeedCard } from '../../components/feed/FeedCard';
import { FeedModal } from '../../components/feed/FeedModal';
import { StoryModal } from '../../components/story/StoryModal';
import { StoriesBar } from '../../components/story/StoriesBar';

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
                        filter: { userIds: [user.id] },
                        limit: 10,
                    },
                },
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
        getNextPageParam: (lastPage) => {
            const p = lastPage.pagination;
            if (p?.hasNextPage && p?.page) {
                return p.page + 1;
            }
            return undefined;
        },
        enabled: !!user?.id && canViewPrivateContent,
    });

    const userFeedsData = useMemo(() => {
        return userFeedsInfiniteData?.pages.flatMap((page) => page.data ?? []) ?? [];
    }, [userFeedsInfiniteData]);

    const feedObserver = useRef<IntersectionObserver | null>(null);
    const lastFeedElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isFetchingMoreFeeds) return;
            if (feedObserver.current) feedObserver.current.disconnect();
            if (!node) return;
            feedObserver.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMoreFeeds) {
                    fetchNextFeedsPage();
                }
            });
            feedObserver.current.observe(node);
        },
        [isFetchingMoreFeeds, hasMoreFeeds, fetchNextFeedsPage],
    );

    const {
        data: userStoriesInfiniteData,
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
        getNextPageParam: (lastPage) => {
            const p = lastPage.pagination;
            if (p?.hasNextPage && p?.page) {
                return p.page + 1;
            }
            return undefined;
        },
        enabled: !!user?.id && canViewPrivateContent,
    });

    const userStoriesData = useMemo(() => {
        return userStoriesInfiniteData?.pages.flatMap((page) => page.data ?? []) ?? [];
    }, [userStoriesInfiniteData]);

    const storiesViewportRef = useRef<HTMLDivElement>(null);
    const handleStoriesScroll = useCallback(
        (position: { x: number; y: number }) => {
            const el = storiesViewportRef.current;
            if (!el || isFetchingMoreStories || !hasMoreStories) return;
            const scrollRight = el.scrollWidth - el.clientWidth - position.x;
            if (scrollRight < 100) {
                fetchNextStoriesPage();
            }
        },
        [isFetchingMoreStories, hasMoreStories, fetchNextStoriesPage],
    );

    const storyObserver = useRef<IntersectionObserver | null>(null);
    const lastStoryElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isFetchingMoreStories) return;
            if (storyObserver.current) storyObserver.current.disconnect();
            if (!node) return;
            storyObserver.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMoreStories) {
                        fetchNextStoriesPage();
                    }
                },
                { root: storiesViewportRef.current },
            );
            storyObserver.current.observe(node);
        },
        [isFetchingMoreStories, hasMoreStories, fetchNextStoriesPage],
    );

    const userStoryGroups = useMemo<UserStoriesGroup[]>(() => {
        if (!user || !userStoriesData || userStoriesData.length === 0) return [];
        const parseTime = (dateStr?: string) => (dateStr ? new Date(dateStr.replace(' ', 'T')).getTime() : 0);
        const sorted = [...userStoriesData].sort((a, b) => parseTime(a.createdAt) - parseTime(b.createdAt));
        const newest = [...userStoriesData].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt))[0];

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
            if (!user?.id) return;
            await friendService.createFriend({
                body: { userId: user.id },
            });
        },
        onSuccess: () => {
            refetchFriendship();
            notifications.show({ title: t('friend'), message: t('friendRequestSent'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateFriendStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: number }) => {
            await friendService.updateFriendStatus({
                params: { path: { id } },
                body: { status: status as FriendStatusEnum },
            });
        },
        onSuccess: () => {
            refetchFriendship();
            notifications.show({ title: t('friend'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteFriendMutation = useMutation({
        mutationFn: async (id: string) => {
            await friendService.deleteFriend({
                params: { path: { id } },
            });
        },
        onSuccess: () => {
            refetchFriendship();
            notifications.show({ title: t('friend'), message: t('friendRemoved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
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
            queryClient.invalidateQueries({ queryKey: ['user', link] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            notifications.show({ title: t('users'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) return;
            await userService.deleteUser({
                params: { path: { id: user.id } },
            });
        },
        onSuccess: async () => {
            notifications.show({ title: t('users'), message: t('deleted'), color: 'green' });
            await logout();
            navigate('/sign');
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDeleteUser = () => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteUserMutation.mutate(),
        });
    };

    const deleteStoryMutation = useMutation({
        mutationFn: async (id: string) => {
            await storyService.deleteStory({
                params: { path: { id } },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDeleteStory = (id: string) => {
        deleteStoryMutation.mutate(id);
    };

    const deleteFeedMutation = useMutation({
        mutationFn: async (id: string) => {
            await feedService.deleteFeed({
                params: { path: { id } },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDeleteFeed = (id: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteFeedMutation.mutate(id),
        });
    };

    if (userLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!user) {
        return <NotFound title={t('userNotFound')} />;
    }

    const userProfilePhotoSrc = formatImageSrc(user.profilePhoto);
    const userBgPhotoSrc = formatImageSrc(user.backgroundPhoto);

    return (
        <Stack gap="md">
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
                                onChange={(st) => updateUserStatusMutation.mutate(st as UserStatusEnum)}
                                loading={updateUserStatusMutation.isPending}
                            />
                        )}

                        {isOwner && (
                            <>
                                <EditActionButton onClick={() => setEditUserOpened(true)} />
                                <DeleteActionButton onClick={handleDeleteUser} loading={deleteUserMutation.isPending} />
                            </>
                        )}

                        {!isOwner && currentUser && (
                            <Group gap="xs">
                                {!friendship && (
                                    <Button
                                        size="xs"
                                        leftSection={<IconUserPlus size={16} />}
                                        onClick={() => sendFriendMutation.mutate()}
                                        loading={sendFriendMutation.isPending}
                                        disabled={sendFriendMutation.isPending}
                                    >
                                        {t('add')}
                                    </Button>
                                )}

                                {friendship && friendship.status === FriendStatusEnum.REJECTED && (
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
                                )}

                                {friendship && friendship.status === FriendStatusEnum.ACCEPTED && (
                                    <Button
                                        variant="default"
                                        size="xs"
                                        leftSection={<IconUserMinus size={16} />}
                                        onClick={() => {
                                            openConfirmActionModal({
                                                title: t('confirmFriendRemovalTitle'),
                                                message: t('confirmFriendRemovalMessage'),
                                                confirmLabel: t('delete'),
                                                cancelLabel: t('cancel'),
                                                onConfirm: () => deleteFriendMutation.mutate(friendship.id),
                                            });
                                        }}
                                        loading={deleteFriendMutation.isPending}
                                        disabled={deleteFriendMutation.isPending}
                                    >
                                        {t('delete')}
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
                                ? t('roles.administrator')
                                : r.role === RoleEnum.ORGANIZER
                                  ? t('roles.organizer')
                                  : t('roles.participant'));
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

            <UserProfileNav user={user} isOwner={isOwner} simplifiedHeader={false} />

            {canViewPrivateContent && (
                <>
                    {(isOwner || userStoriesData?.length > 0) && (
                        <StoriesBar
                            groups={userStoryGroups}
                            onSelectGroup={() => setStoryViewerOpened(true)}
                            onAddStory={isOwner ? () => setStoryModalOpened(true) : undefined}
                            onAddFeed={isOwner ? () => setFeedModalOpened(true) : undefined}
                            isFetchingMore={isFetchingMoreStories}
                            viewportRef={storiesViewportRef}
                            onScrollPositionChange={handleStoriesScroll}
                            lastStoryElementRef={lastStoryElementRef}
                        />
                    )}

                    <Stack gap="md">
                        {feedsLoading ? (
                            <Text ta="center" c="dimmed">
                                {t('loadingFeeds')}
                            </Text>
                        ) : userFeedsData?.length === 0 ? (
                            <EmptyState title={t('noData')} />
                        ) : (
                            userFeedsData?.map((feed, idx) => (
                                <FeedCard
                                    key={feed.id}
                                    feed={feed}
                                    author={user}
                                    onEditFeed={isOwner ? (f) => setEditingFeed(f) : undefined}
                                    onDeleteFeed={isOwner ? handleDeleteFeed : undefined}
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
                onSuccess={(updated) => {
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
                onDelete={isOwner ? handleDeleteStory : undefined}
                updatedStory={updatedStoryForModal}
            />
        </Stack>
    );
}
