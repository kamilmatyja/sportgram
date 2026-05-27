import {useEffect, useState} from 'react';
import {UserProvider} from '../../api/providers/UserProvider';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {useCheckPermission} from '../../utils/checkPermission';
import {FriendBody} from '../../api/body/FriendBody';
import {StatusBody} from '../../api/body/StatusBody';
import {RoleEnum} from '../../enums/RoleEnum';
import {useTranslation} from '../../context/TranslationContext';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {FriendIndexQuery} from '../../api/queries/FriendIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {FriendFilterQuery} from '../../api/queries/FriendFilterQuery';

export function useUserProfile(link?: string) {
    const {t} = useTranslation();
    const {getCurrentUser} = useCheckPermission();
    const [user, setUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [friendship, setFriendship] = useState<FriendResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            const currentUsr = await getCurrentUser();
            setCurrentUser(currentUsr);

            const filterDto = new UserFilterQuery();
            filterDto.link = link;
            const indexDto = new UserIndexQuery();
            indexDto.filter = filterDto;
            const targetUsers = await userProvider.index(indexDto);

            if (targetUsers.length === 0) {
                setError('userNotFound');
                return;
            }

            const profileUser = targetUsers[0];
            const fullProfileUser = await userProvider.details(profileUser.id, ['userRoles', 'userDisciplines']);
            setUser(fullProfileUser);

            if (currentUsr && currentUsr.id !== profileUser.id) {
                const friendFilter = new FriendFilterQuery();
                friendFilter.userIds = [profileUser.id, currentUsr.id];
                const friendIndexDto = new FriendIndexQuery();
                friendIndexDto.filter = friendFilter;
                const friends = await friendProvider.index(friendIndexDto);
                const relation = friends.find((f: FriendResponse) =>
                    (f.senderUserId === currentUsr.id && f.receiverUserId === profileUser.id) ||
                    (f.senderUserId === profileUser.id && f.receiverUserId === currentUsr.id)
                );
                setFriendship(relation || null);
            } else {
                setFriendship(null);
            }
        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (link) {
            fetchProfileData();
        }
    }, [link]);

    const handleAddFriend = async () => {
        if (!user || !currentUser) return;
        setActionLoading(true);
        try {
            await friendProvider.create(new FriendBody(user.id));
            await fetchProfileData();
        } catch (e: any) {
            if (e.error) alert(t(e.error) !== e.error ? t(e.error) : e.error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateFriendStatus = async (newStatus: number) => {
        if (!friendship || !user) return;
        setActionLoading(true);
        try {
            await friendProvider.updateStatus(friendship.id, new StatusBody(newStatus));
            await fetchProfileData();
        } catch (e: any) {
            if (e.error) alert(t(e.error) !== e.error ? t(e.error) : e.error);
        } finally {
            setActionLoading(false);
        }
    };

    const refreshProfile = () => {
        if (link) {
            fetchProfileData();
        }
    };

    const isMyProfile = Boolean(currentUser && user && currentUser.id === user.id);
    const isAdmin = Boolean(currentUser && Array.isArray(currentUser.roles) && currentUser.roles.some((role: any) => role.role === RoleEnum.ADMINISTRATOR));

    return {
        user, currentUser, friendship, loading, actionLoading, error,
        handleAddFriend, handleUpdateFriendStatus,
        isMyProfile, isAdmin, refreshProfile
    };
}