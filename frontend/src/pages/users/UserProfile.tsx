import { useState, useMemo, useRef, useCallback } from 'react';
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
    Center,
    Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconEdit,
    IconUserPlus,
    IconAdjustments,
    IconPhoto,
    IconPlus,
    IconMessageCircle,
    IconTrash,
    IconUserMinus,
    IconUserCheck,
    IconUserX,
    IconCheck,
    IconX,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import NotFound from '../../components/NotFound';
import { EmptyState } from '../../components/EmptyState';
import { StoryViewerModal, type UserStoriesGroup } from '../../components/StoryViewerModal';
import {
    userService,
    friendService,
    feedService,
    storyService,
    type UserResource,
    type FeedResource,
    type StoryResource,
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
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { UserProfileNav } from '../../components/UserProfileNav';
import { EntityViewCounter } from '../../components/EntityViewCounter';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { fileToBase64, formatImageSrc } from '../../utils/imageUtils';
import { formatDateTime } from '../../utils/date';
import { formatFeedOrigin } from '../../utils/text';
import { openConfirmActionModal } from '../../utils/confirmModal.tsx';

export default function UserProfile() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const { currentUser, isAdmin, refetchUser, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

    const [storyOpened, { open: openStoryModal, close: closeStoryModal }] = useDisclosure(false);
    const [storyText, setStoryText] = useState('');
    const [storyPhoto, setStoryPhoto] = useState<File | null>(null);
    const [storyViewerOpened, setStoryViewerOpened] = useState(false);
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
    const [feedFieldErrors, setFeedFieldErrors] = useState<Record<string, string>>({});
    const [storyFieldErrors, setStoryFieldErrors] = useState<Record<string, string>>({});

    const [editingStory, setEditingStory] = useState<StoryResource | null>(null);
    const [editStoryOpened, { open: openEditStoryModal, close: closeEditStoryModal }] = useDisclosure(false);
    const [editStoryText, setEditStoryText] = useState('');
    const [editStoryPhoto, setEditStoryPhoto] = useState<File | null>(null);
    const [editStoryFieldErrors, setEditStoryFieldErrors] = useState<Record<string, string>>({});

    const [feedOpened, { open: openFeedModal, close: closeFeedModal }] = useDisclosure(false);
    const [feedText, setFeedText] = useState('');
    const [feedPhoto, setFeedPhoto] = useState<File | null>(null);

    const [editingFeed, setEditingFeed] = useState<FeedResource | null>(null);
    const [editFeedOpened, { open: openEditFeedModal, close: closeEditFeedModal }] = useDisclosure(false);
    const [editFeedText, setEditFeedText] = useState('');
    const [editFeedPhoto, setEditFeedPhoto] = useState<File | null>(null);
    const [editFeedFieldErrors, setEditFeedFieldErrors] = useState<Record<string, string>>({});

    const [openCommentsFeedId, setOpenCommentsFeedId] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');

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
    const primaryColor = ColorEnum.getMantineColor(user?.color);

    const { data: friendship, refetch: refetchFriendship } = useQuery({
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

    const isAcceptedFriend = friendship?.status === FriendStatusEnum.ACCEPTED;
    const canViewPrivateContent = isOwner || isAdmin || isAcceptedFriend;

    const {
        data: userFeedsInfiniteData,
        isLoading: feedsLoading,
        fetchNextPage: fetchNextFeedsPage,
        hasNextPage: hasMoreFeeds,
        isFetchingNextPage: isFetchingMoreFeeds,
    } = useInfiniteQuery({
        queryKey: ['user-profile-feeds', user?.id],
        queryFn: async ({ pageParam = 1 }) => {
            if (!user?.id) return { data: [], pagination: {} };
            return await feedService.getFeeds({
                filter: { userId: user.id },
                page: pageParam,
                limit: 10,
                sort: 'createdAt:desc',
                'include[]': ['feedComments', 'feedReactions', 'feedOrigin'],
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
            if (!user?.id) return { data: [], pagination: {} };
            return await storyService.getStories({
                filter: { userId: user.id },
                page: pageParam,
                limit: 10,
                sort: 'createdAt:desc',
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
        ({ x }: { x: number }) => {
            if (!storiesViewportRef.current || !hasMoreStories || isFetchingMoreStories) return;
            const { scrollWidth, clientWidth } = storiesViewportRef.current;
            if (x + clientWidth >= scrollWidth - 60) {
                fetchNextStoriesPage();
            }
        },
        [hasMoreStories, isFetchingMoreStories, fetchNextStoriesPage],
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

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
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

    const [updatedStoryForModal, setUpdatedStoryForModal] = useState<StoryResource | null>(null);
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [backgroundPhotoFile, setBackgroundPhotoFile] = useState<File | null>(null);

    const handleOpenEdit = () => {
        if (!user) return;
        setFormData({
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            email: user.email ?? '',
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
                email: formData.email,
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

    const deleteFriendMutation = useMutation({
        mutationFn: async (friendId: string) => {
            await friendService.deleteFriend(friendId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friendship'] });
            queryClient.invalidateQueries({ queryKey: ['friend-relation'] });
            queryClient.invalidateQueries({ queryKey: ['user-friends'] });
            refetchFriendship();
            notifications.show({ title: t('friend'), message: t('friendRemoved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async () => {
            if (!user) return;
            await userService.deleteUser(user.id);
        },
        onSuccess: async () => {
            notifications.show({ title: t('users'), message: t('deleted'), color: 'green' });
            await logout();
            navigate('/login');
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

    const sendFriendMutation = useMutation({
        mutationFn: async () => {
            if (!user) return;
            await friendService.sendFriendRequest(user.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friendship'] });
            queryClient.invalidateQueries({ queryKey: ['friend-relation'] });
            queryClient.invalidateQueries({ queryKey: ['user-friends'] });
            refetchFriendship();
            notifications.show({ title: t('friend'), message: t('friendRequestSent'), color: 'green' });
        },
    });

    const updateUserStatusMutation = useMutation({
        mutationFn: async (status: UserStatusEnum) => {
            if (!user) return;
            await userService.updateUserStatus(user.id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', link] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            notifications.show({ title: t('userStatus'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateFriendStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: FriendStatusEnum }) => {
            await friendService.updateFriendStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friendship'] });
            queryClient.invalidateQueries({ queryKey: ['friend-relation'] });
            queryClient.invalidateQueries({ queryKey: ['user-friends'] });
            refetchFriendship();
            notifications.show({ title: t('friend'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

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
            closeFeedModal();
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

    const updateFeedMutation = useMutation({
        mutationFn: async () => {
            if (!editingFeed) return;
            let photoStr = editingFeed.photo;
            if (editFeedPhoto) {
                photoStr = await fileToBase64(editFeedPhoto);
            }
            await feedService.updateFeed(editingFeed.id, {
                text: editFeedText,
                photo: photoStr ?? '',
            });
        },
        onSuccess: () => {
            closeEditFeedModal();
            setEditingFeed(null);
            setEditFeedPhoto(null);
            setEditFeedFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            notifications.show({ title: t('feeds'), message: t('feedUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFeedFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEditFeed = (feed: FeedResource) => {
        setEditingFeed(feed);
        setEditFeedText(feed.text || '');
        setEditFeedPhoto(null);
        setEditFeedFieldErrors({});
        openEditFeedModal();
    };

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

    const updateStoryMutation = useMutation({
        mutationFn: async () => {
            if (!editingStory) return null;
            let photoStr = editingStory.photo;
            if (editStoryPhoto) {
                photoStr = await fileToBase64(editStoryPhoto);
            }
            await storyService.updateStory(editingStory.id, {
                text: editStoryText,
                photo: photoStr ?? '',
            });
            const res = await storyService.getStory(editingStory.id);
            return res.data ?? null;
        },
        onSuccess: (freshStory) => {
            closeEditStoryModal();
            setEditingStory(null);
            setEditStoryPhoto(null);
            setEditStoryFieldErrors({});
            if (freshStory) {
                setUpdatedStoryForModal(freshStory);
            }
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditStoryFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEditStory = (story: StoryResource) => {
        setEditingStory(story);
        setEditStoryText(story.text || '');
        setEditStoryPhoto(null);
        setEditStoryFieldErrors({});
        openEditStoryModal();
    };

    const deleteStoryMutation = useMutation({
        mutationFn: async (id: string) => {
            await storyService.deleteStory(id);
        },
        onSuccess: () => {
            setStoryViewerOpened(false);
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            notifications.show({ title: t('stories'), message: t('storyDeleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDeleteStory = (id: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteStoryMutation.mutate(id),
        });
    };

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

    const handleReaction = (feedId: string, type: number, myReaction?: FeedReactionResource) => {
        if (!myReaction) {
            addReactionMutation.mutate({ feedId, type });
        } else if (myReaction.reaction === type) {
            deleteReactionMutation.mutate(myReaction.id);
        } else {
            updateReactionMutation.mutate({ reactionId: myReaction.id, type });
        }
    };

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

    const hasProfilePhoto = !!(profilePhotoFile || user.profilePhoto);
    const hasBgPhoto = !!(backgroundPhotoFile || user.backgroundPhoto);

    const userProfilePhotoSrc = formatImageSrc(user.profilePhoto);
    const userBgPhotoSrc = formatImageSrc(user.backgroundPhoto);

    return (
        <Stack gap="lg">
            <Card withBorder radius="md" p={0} shadow="xs" className="overflow-hidden">
                {userBgPhotoSrc ? (
                    <Box h={160} pos="relative" bg="var(--mantine-primary-color-filled)">
                        <Center pos="absolute" inset={0} className="header-bg-placeholder-center">
                            <Text fz={48} fw={700} c="white" className="header-bg-placeholder-text">
                                ?
                            </Text>
                        </Center>
                        <Image
                            className="header-bg-image"
                            src={userBgPhotoSrc}
                            h={160}
                            w="100%"
                            fit="cover"
                            alt={user.firstName}
                            pos="relative"
                            onError={(e) => {
                                e.currentTarget.classList.add('d-none');
                            }}
                        />
                    </Box>
                ) : (
                    <Center h={160} bg="var(--mantine-primary-color-filled)">
                        <Text fz={48} fw={700} c="white" className="header-bg-placeholder-text">
                            ?
                        </Text>
                    </Center>
                )}

                <Box p="md" pos="relative" className="header-content-box">
                    <Avatar
                        src={userProfilePhotoSrc}
                        size={100}
                        radius={5}
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
                            <Group gap="xs" align="center" mt={2}>
                                <Text size="sm" c="dimmed">
                                    @{user.link}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    •
                                </Text>
                                <EntityViewCounter entityId={user.id} type={EntryTypeEnum.USER} track={true} />
                            </Group>
                        </div>

                        <Group gap="xs">
                            {isAdmin && (
                                <Menu shadow="md" width={180} position="bottom-end">
                                    <Menu.Target>
                                        <Tooltip label={t('changeStatus')} withArrow>
                                            <ActionIcon
                                                variant="light"
                                                size={30}
                                                aria-label={t('changeStatus')}
                                                loading={updateUserStatusMutation.isPending}
                                            >
                                                <IconAdjustments size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        {UserStatusEnum.getOptions(t).map((opt) => (
                                            <Menu.Item
                                                key={opt.value}
                                                disabled={
                                                    user.status === opt.value || updateUserStatusMutation.isPending
                                                }
                                                onClick={() =>
                                                    updateUserStatusMutation.mutate(opt.value as UserStatusEnum)
                                                }
                                            >
                                                {opt.label}
                                            </Menu.Item>
                                        ))}
                                    </Menu.Dropdown>
                                </Menu>
                            )}

                            {isOwner && (
                                <>
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
                                    <Tooltip label={t('delete')} withArrow>
                                        <ActionIcon
                                            variant="light"
                                            color="red"
                                            size={30}
                                            onClick={handleDeleteUser}
                                            loading={deleteUserMutation.isPending}
                                            disabled={deleteUserMutation.isPending}
                                            aria-label={t('delete')}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Tooltip>
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
                                            {t('addFriend')}
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
                                            {t('removeFriend')}
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
                        {user.roles?.map((r) => (
                            <Badge key={r.id} color={primaryColor} variant="outline">
                                {r.role === RoleEnum.ADMINISTRATOR
                                    ? t('roles.administrator')
                                    : r.role === RoleEnum.ORGANIZER
                                      ? t('roles.organizer')
                                      : t('roles.participant')}
                            </Badge>
                        ))}
                        {user.disciplines?.map((d) => (
                            <Badge key={d.id} variant="light">
                                {DisciplineEnum.getOptions(t).find((o) => o.value === d.discipline)?.label ??
                                    d.discipline}
                            </Badge>
                        ))}
                    </Group>
                </Box>
            </Card>

            <UserProfileNav user={user} isOwner={isOwner} simplifiedHeader={false} />

            {canViewPrivateContent && (
                <>
                    {(isOwner || userStoriesData?.length > 0) && (
                        <Card withBorder radius="md" p="sm" shadow="xs">
                            <ScrollArea
                                type="never"
                                viewportRef={storiesViewportRef}
                                onScrollPositionChange={handleStoriesScroll}
                            >
                                <Group gap="md" wrap="nowrap">
                                    {isOwner && (
                                        <Stack align="center" gap={4} className="pointer" onClick={openStoryModal}>
                                            <Avatar radius={5} size="lg">
                                                <IconPlus size={24} />
                                            </Avatar>
                                            <Text size="xs" fw={500}>
                                                {t('addStory')}
                                            </Text>
                                        </Stack>
                                    )}

                                    {isOwner && (
                                        <Stack align="center" gap={4} className="pointer" onClick={openFeedModal}>
                                            <Avatar radius={5} size="lg">
                                                <IconPlus size={24} />
                                            </Avatar>
                                            <Text size="xs" fw={500}>
                                                {t('addFeed')}
                                            </Text>
                                        </Stack>
                                    )}

                                    {userStoryGroups.map((group) => {
                                        const storyImg =
                                            formatImageSrc(group.newestStory?.photo) || userProfilePhotoSrc;
                                        return (
                                            <Stack
                                                key={group.userId}
                                                ref={lastStoryElementRef}
                                                align="center"
                                                gap={4}
                                                className="pointer"
                                                miw={64}
                                                onClick={() => setStoryViewerOpened(true)}
                                            >
                                                <Avatar
                                                    src={storyImg}
                                                    radius={5}
                                                    size="lg"
                                                    className="story-avatar-border"
                                                >
                                                    ?
                                                </Avatar>
                                                <Text size="xs" lineClamp={1}>
                                                    {user.firstName}
                                                </Text>
                                            </Stack>
                                        );
                                    })}

                                    {isFetchingMoreStories && (
                                        <Center px="md">
                                            <Loader size="sm" />
                                        </Center>
                                    )}
                                </Group>
                            </ScrollArea>
                        </Card>
                    )}

                    <Stack gap="md">
                        {feedsLoading ? (
                            <Text ta="center" c="dimmed">
                                {t('loadingFeeds')}
                            </Text>
                        ) : userFeedsData?.length === 0 ? (
                            <EmptyState title={t('noData')} />
                        ) : (
                            userFeedsData?.map((feed, idx) => {
                                const commentsOpen = openCommentsFeedId === feed.id;
                                const reactionCounts: Record<number, number> = {};
                                feed.reactions?.forEach((r) => {
                                    reactionCounts[r.reaction] = (reactionCounts[r.reaction] ?? 0) + 1;
                                });
                                const myReaction = feed.reactions?.find((r) => r.userId === currentUser?.id);

                                return (
                                    <Card
                                        key={feed.id}
                                        withBorder
                                        radius="md"
                                        shadow="xs"
                                        p="md"
                                        ref={idx === userFeedsData.length - 1 ? lastFeedElementRef : undefined}
                                    >
                                        <Group justify="space-between" mb="xs">
                                            <Group gap="sm">
                                                {user?.link || link ? (
                                                    <Link to={`/users/${user?.link || link}`} className="no-decoration">
                                                        <Avatar src={userProfilePhotoSrc} radius={5}>
                                                            ?
                                                        </Avatar>
                                                    </Link>
                                                ) : (
                                                    <Avatar src={userProfilePhotoSrc} radius={5}>
                                                        ?
                                                    </Avatar>
                                                )}
                                                <Box>
                                                    {user?.link || link ? (
                                                        <Text
                                                            size="sm"
                                                            fw={600}
                                                            component={Link}
                                                            to={`/users/${user?.link || link}`}
                                                            className="no-decoration"
                                                        >
                                                            {user.firstName} {user.lastName}
                                                        </Text>
                                                    ) : (
                                                        <Text size="sm" fw={600}>
                                                            {user.firstName} {user.lastName}
                                                        </Text>
                                                    )}
                                                    <Text size="sm" c="dimmed">
                                                        {formatDateTime(feed.createdAt)}
                                                    </Text>
                                                </Box>
                                            </Group>

                                            {currentUser?.id === feed.userId && (
                                                <Group gap="xs">
                                                    <Tooltip label={t('editFeed')} withArrow>
                                                        <ActionIcon
                                                            variant="light"
                                                            size={30}
                                                            onClick={() => handleOpenEditFeed(feed)}
                                                            aria-label={t('editFeed')}
                                                        >
                                                            <IconEdit size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
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
                                                </Group>
                                            )}
                                        </Group>

                                        {feed.feedOrigin && (
                                            <Badge variant="light" color={primaryColor} size="sm" mb="xs">
                                                {formatFeedOrigin(feed.feedOrigin, t)}
                                            </Badge>
                                        )}

                                        {feed.text && (
                                            <Text size="sm" mb="sm" className="pre-wrap">
                                                {feed.text}
                                            </Text>
                                        )}

                                        {feed.photo && (
                                            <Image
                                                src={formatImageSrc(feed.photo)}
                                                alt={t('photo')}
                                                mah={400}
                                                fit="cover"
                                                radius={5}
                                                mb="sm"
                                            />
                                        )}

                                        <Group justify="space-between" mt="xs">
                                            <Group gap="xs">
                                                <Group gap={4} wrap="wrap">
                                                    {FeedReactionEnum.ALL_REACTIONS.map((r) => {
                                                        const count =
                                                            feed.reactions?.filter((rx) => rx.reaction === r.type)
                                                                .length ?? 0;
                                                        const isMy = myReaction?.reaction === r.type;
                                                        return (
                                                            <Button
                                                                key={r.type}
                                                                variant={isMy ? 'light' : 'subtle'}
                                                                color={isMy ? undefined : 'gray'}
                                                                size="xs"
                                                                px={6}
                                                                onClick={() =>
                                                                    handleReaction(feed.id, r.type, myReaction)
                                                                }
                                                                aria-label={t(`feedReactions.${r.key}`)}
                                                            >
                                                                <span className="reaction-item-emoji">{r.emoji}</span>
                                                                {count > 0 && (
                                                                    <Text span size="xs" ml={4} fw={isMy ? 600 : 400}>
                                                                        {count}
                                                                    </Text>
                                                                )}
                                                            </Button>
                                                        );
                                                    })}
                                                </Group>

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

                                            <EntityViewCounter
                                                entityId={feed.id}
                                                type={EntryTypeEnum.FEED}
                                                size={16}
                                                textSize="xs"
                                                track={true}
                                            />
                                        </Group>

                                        <Collapse expanded={commentsOpen}>
                                            <Stack gap="xs" mt="sm">
                                                {feed.comments?.map((c) => {
                                                    const cAuthor =
                                                        commentUsersMap[c.userId] ??
                                                        (currentUser?.id === c.userId ? currentUser : undefined);
                                                    const cAuthorName = cAuthor
                                                        ? `${cAuthor.firstName ?? ''} ${cAuthor.lastName ?? ''}`.trim() ||
                                                          cAuthor.link ||
                                                          c.userId
                                                        : c.userId;
                                                    const cAuthorPhoto = formatImageSrc(cAuthor?.profilePhoto);
                                                    const canManageComment = currentUser?.id === c.userId;
                                                    const isEditing = editingCommentId === c.id;

                                                    return (
                                                        <Paper key={c.id} p="xs" withBorder radius="sm">
                                                            <Group
                                                                justify="space-between"
                                                                align="center"
                                                                wrap="nowrap"
                                                                mb="xs"
                                                            >
                                                                <Group gap="sm" wrap="nowrap">
                                                                    {cAuthor?.link ? (
                                                                        <Link
                                                                            to={`/users/${cAuthor.link}`}
                                                                            className="no-decoration"
                                                                        >
                                                                            <Avatar src={cAuthorPhoto} radius={5}>
                                                                                ?
                                                                            </Avatar>
                                                                        </Link>
                                                                    ) : (
                                                                        <Avatar src={cAuthorPhoto} radius={5}>
                                                                            ?
                                                                        </Avatar>
                                                                    )}
                                                                    <Box>
                                                                        {cAuthor?.link ? (
                                                                            <Text
                                                                                size="sm"
                                                                                fw={600}
                                                                                component={Link}
                                                                                to={`/users/${cAuthor.link}`}
                                                                                className="no-decoration"
                                                                            >
                                                                                {cAuthorName}
                                                                            </Text>
                                                                        ) : (
                                                                            <Text size="sm" fw={600}>
                                                                                {cAuthorName}
                                                                            </Text>
                                                                        )}
                                                                        <Text size="sm" c="dimmed">
                                                                            {formatDateTime(c.createdAt)}
                                                                        </Text>
                                                                    </Box>
                                                                </Group>

                                                                {canManageComment && !isEditing && (
                                                                    <Group gap={4} wrap="nowrap">
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
                                                                                onClick={() =>
                                                                                    handleDeleteComment(c.id)
                                                                                }
                                                                                loading={
                                                                                    deleteCommentMutation.isPending
                                                                                }
                                                                                disabled={
                                                                                    deleteCommentMutation.isPending
                                                                                }
                                                                                aria-label={t('deleteComment')}
                                                                            >
                                                                                <IconTrash size={16} />
                                                                            </ActionIcon>
                                                                        </Tooltip>
                                                                    </Group>
                                                                )}
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
                                                        onChange={(e) => {
                                                            const value = e.currentTarget.value;
                                                            setCommentInputs((prev) => ({
                                                                ...prev,
                                                                [feed.id]: value,
                                                            }));
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key === 'Enter' &&
                                                                (commentInputs[feed.id] ?? '').trim()
                                                            ) {
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
                                                        {t('add')}
                                                    </Button>
                                                </Group>
                                            </Stack>
                                        </Collapse>
                                    </Card>
                                );
                            })
                        )}

                        {hasMoreFeeds && (
                            <Center my="md">
                                <Button
                                    variant="light"
                                    onClick={() => fetchNextFeedsPage()}
                                    loading={isFetchingMoreFeeds}
                                >
                                    {t('loadMore')}
                                </Button>
                            </Center>
                        )}
                    </Stack>
                </>
            )}

            <Modal opened={storyOpened} onClose={closeStoryModal} title={t('addStory')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        value={storyText}
                        error={storyFieldErrors.text}
                        onChange={(e) => setStoryText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhoto')}
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
                            label={t('email')}
                            placeholder={t('emailPlaceholder')}
                            required
                            type="email"
                            value={formData.email}
                            error={editFieldErrors.email}
                            onChange={(e) => setFormData({ ...formData, email: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('password')}
                            placeholder={t('passwordPlaceholder')}
                            description={t('leaveEmptyToKeep')}
                            type="password"
                            value={formData.password}
                            error={editFieldErrors.password}
                            onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
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

                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                        <TextInput
                            label={t('birthAt')}
                            type="date"
                            required
                            value={formData.birthAt}
                            error={editFieldErrors.birthAt}
                            onChange={(e) => setFormData({ ...formData, birthAt: e.currentTarget.value })}
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
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
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

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
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
                            label={t('disciplinesLabel')}
                            placeholder={t('disciplinesLabel')}
                            clearable
                            data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                            value={formData.disciplines}
                            error={editFieldErrors.disciplines}
                            onChange={(val) => setFormData({ ...formData, disciplines: val })}
                        />
                    </SimpleGrid>

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
                            placeholder={t('selectPhoto')}
                            description={t('leaveEmptyToKeep')}
                            accept="image/*"
                            leftSection={<IconPhoto size={16} />}
                            value={profilePhotoFile}
                            onChange={setProfilePhotoFile}
                            error={editFieldErrors.profilePhoto}
                            clearable
                        />
                        <FileInput
                            label={t('backgroundPhoto')}
                            placeholder={t('selectPhoto')}
                            description={t('leaveEmptyToKeep')}
                            accept="image/*"
                            leftSection={<IconPhoto size={16} />}
                            value={backgroundPhotoFile}
                            onChange={setBackgroundPhotoFile}
                            error={editFieldErrors.backgroundPhoto}
                            clearable
                        />
                    </SimpleGrid>

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
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>

            <Modal
                opened={editStoryOpened}
                onClose={closeEditStoryModal}
                title={t('editStory')}
                size="lg"
                zIndex={1000}
            >
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        value={editStoryText}
                        error={editStoryFieldErrors.text}
                        onChange={(e) => setEditStoryText(e.currentTarget.value)}
                        required
                    />
                    <FileInput
                        label={t('photo')}
                        placeholder={t('selectPhoto')}
                        description={t('leaveEmptyToKeep')}
                        accept="image/*"
                        leftSection={<IconPhoto size={16} />}
                        value={editStoryPhoto}
                        error={editStoryFieldErrors.photo}
                        onChange={setEditStoryPhoto}
                        clearable
                    />
                    <Button
                        mt="md"
                        loading={updateStoryMutation.isPending}
                        disabled={updateStoryMutation.isPending || !editStoryText.trim()}
                        onClick={() => updateStoryMutation.mutate()}
                    >
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>

            <Modal opened={feedOpened} onClose={closeFeedModal} title={t('addFeed')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        required
                        autosize
                        minRows={2}
                        value={feedText}
                        error={feedFieldErrors.text}
                        onChange={(e) => {
                            setFeedText(e.currentTarget.value);
                            if (feedFieldErrors.text) setFeedFieldErrors({ ...feedFieldErrors, text: '' });
                        }}
                    />

                    <FileInput
                        label={t('photo')}
                        required
                        leftSection={<IconPhoto size={16} />}
                        placeholder={t('selectPhoto')}
                        accept="image/*"
                        value={feedPhoto}
                        error={feedFieldErrors.photo}
                        onChange={setFeedPhoto}
                        clearable
                    />

                    <Button
                        mt="md"
                        loading={createFeedMutation.isPending}
                        disabled={createFeedMutation.isPending || !feedText.trim() || !feedPhoto}
                        onClick={() => createFeedMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            <Modal opened={editFeedOpened} onClose={closeEditFeedModal} title={t('editFeed')} size="lg">
                <Stack gap="sm">
                    <Textarea
                        label={t('text')}
                        required
                        autosize
                        minRows={2}
                        value={editFeedText}
                        error={editFeedFieldErrors.text}
                        onChange={(e) => {
                            setEditFeedText(e.currentTarget.value);
                            if (editFeedFieldErrors.text) setEditFeedFieldErrors({ ...editFeedFieldErrors, text: '' });
                        }}
                    />

                    <FileInput
                        label={t('photo')}
                        leftSection={<IconPhoto size={16} />}
                        placeholder={t('selectPhoto')}
                        description={t('leaveEmptyToKeep')}
                        accept="image/*"
                        value={editFeedPhoto}
                        error={editFeedFieldErrors.photo}
                        onChange={setEditFeedPhoto}
                        clearable
                    />

                    <Button
                        mt="md"
                        loading={updateFeedMutation.isPending}
                        disabled={updateFeedMutation.isPending || !editFeedText.trim()}
                        onClick={() => updateFeedMutation.mutate()}
                    >
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>

            <StoryViewerModal
                opened={storyViewerOpened}
                onClose={() => setStoryViewerOpened(false)}
                groups={userStoryGroups}
                onEdit={handleOpenEditStory}
                onDelete={handleDeleteStory}
                updatedStory={updatedStoryForModal}
            />
        </Stack>
    );
}
