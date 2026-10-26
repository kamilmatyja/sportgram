import { useState } from 'react';
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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconUserPlus, IconMessage, IconPhoto } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, friendService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { CountryEnum } from '../../enums/CountryEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { LanguageEnum } from '../../enums/LanguageEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { ThemeEnum } from '../../enums/ThemeEnum';
import { UserProfileNav } from '../../components/UserProfileNav';

export default function UserProfile() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const { currentUser, isAdmin, refetchUser } = useAuth();
    const queryClient = useQueryClient();

    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

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

    // Form data for editing profile
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        phone: '',
        country: '35',
        gender: '1',
        birthAt: '2000-01-01',
        theme: '1',
        language: '2',
        color: '1',
        link: '',
        password: '',
        disciplines: [] as string[],
        roles: [] as string[],
    });

    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [backgroundPhotoFile, setBackgroundPhotoFile] = useState<File | null>(null);

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleOpenEdit = () => {
        if (!user) return;
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            bio: user.bio || '',
            phone: String(user.phone || ''),
            country: String(user.country || 35),
            gender: String(user.gender || 1),
            birthAt: user.birthAt ? user.birthAt.split('T')[0] : '2000-01-01',
            theme: String(user.theme || 1),
            language: String(user.language || 2),
            color: String(user.color || 1),
            link: user.link,
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

            return await userService.updateUser(user.id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                bio: formData.bio,
                phone: Number(formData.phone) || 0,
                country: Number(formData.country) as any,
                gender: Number(formData.gender) as 1 | 2,
                birthAt: formData.birthAt,
                theme: Number(formData.theme) as any,
                language: Number(formData.language) as any,
                color: (Number(formData.color) as any) || 1,
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

    return (
        <Stack gap="lg" maw={800} mx="auto">
            <Card withBorder radius="md" p={0} shadow="xs">
                <Box h={140} bg="blue.7" />

                <Box p="md" pos="relative">
                    <Avatar
                        src={user.profilePhoto || undefined}
                        size={100}
                        radius={100}
                        pos="absolute"
                        top={-50}
                        left={24}
                        className="profile-avatar-border"
                    >
                        {user.firstName?.[0]}
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

            {/* Profile subpage navigation buttons */}
            <UserProfileNav userLink={user.link} isOwner={isOwner} />

            {/* Edit User Modal */}
            <Modal opened={editOpened} onClose={closeEdit} title={t('edit')} size="lg">
                <Stack gap="sm">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('firstName')}
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('lastName')}
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.currentTarget.value })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('link')}
                            required
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('phone')}
                            required
                            placeholder="123456789"
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
                            required
                            data={CountryEnum.getOptions(t).map((c) => ({ value: String(c.value), label: c.label }))}
                            value={formData.country}
                            onChange={(val) => val && setFormData({ ...formData, country: val })}
                            searchable
                        />
                        <Select
                            label={t('gender')}
                            required
                            data={GenderEnum.getOptions(t).map((g) => ({ value: String(g.value), label: g.label }))}
                            value={formData.gender}
                            onChange={(val) => val && setFormData({ ...formData, gender: val })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                        <Select
                            label={t('theme')}
                            required
                            data={ThemeEnum.getOptions(t).map((th) => ({ value: String(th.value), label: th.label }))}
                            value={formData.theme}
                            onChange={(val) => val && setFormData({ ...formData, theme: val })}
                        />
                        <Select
                            label={t('language')}
                            required
                            data={LanguageEnum.getOptions(t).map((l) => ({ value: String(l.value), label: l.label }))}
                            value={formData.language}
                            onChange={(val) => val && setFormData({ ...formData, language: val })}
                        />
                        <Select
                            label={t('color')}
                            required
                            data={ColorEnum.getOptions(t).map((cl) => ({ value: String(cl.value), label: cl.label }))}
                            value={formData.color}
                            onChange={(val) => val && setFormData({ ...formData, color: val })}
                        />
                    </SimpleGrid>

                    <MultiSelect
                        label={t('role')}
                        required
                        data={RoleEnum.getOptions(t).map((r) => ({ value: String(r.value), label: r.label }))}
                        value={formData.roles}
                        onChange={(val) => setFormData({ ...formData, roles: val })}
                    />

                    <MultiSelect
                        label={t('discipline')}
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
