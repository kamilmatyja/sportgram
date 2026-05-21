import {useEffect, useState} from 'react';
import {UserProvider} from '../api/providers/UserProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {UserResponse} from '../api/responses/UserResponse';
import {FriendResponse} from '../api/responses/FriendResponse';
import {useCheckPermission} from '../utils/checkPermission';
import {FriendBody} from '../api/body/FriendBody';
import {StatusBody} from '../api/body/StatusBody';
import {RoleEnum} from '../enums/RoleEnum';
import {useTranslation} from '../context/TranslationContext';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {FriendFilterQuery} from '../api/queries/FriendFilterQuery';

export function useUserProfile(link?: string) {
    const {t} = useTranslation();
    const {getCurrentUser} = useCheckPermission();
    const [user, setUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [friendship, setFriendship] = useState<FriendResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    useEffect(() => {
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
                    setError(t('userNotFound'));
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

        if (link) {
            fetchProfileData();
        }
    }, [link]);

    const handleAddFriend = async () => {
        if (!user || !currentUser) return;
        try {
            await friendProvider.create(new FriendBody(user.id));
            const friendFilter: FriendFilterQuery = {userIds: [user.id, currentUser.id]};
            const friendIndexDto: FriendIndexQuery = {page: 1, limit: 1, filter: friendFilter};
            const friends = await friendProvider.index(friendIndexDto);
            setFriendship(friends[0] || null);
        } catch (e: any) {
            alert(e.error);
        }
    };

    const handleUpdateFriendStatus = async (newStatus: number) => {
        if (!friendship || !user) return;
        try {
            await friendProvider.updateStatus(friendship.id, new StatusBody(newStatus));
            setFriendship({...friendship, status: newStatus});
        } catch (e: any) {
            alert(e.error);
        }
    };

    const handleChangeUserStatus = async (newStatus: number) => {
        if (!user) return;
        setStatusLoading(true);
        try {
            await userProvider.updateStatus(user.id, new StatusBody(newStatus));
            setUser({...user, status: newStatus});
        } catch (e: any) {
            alert(e.error);
        } finally {
            setStatusLoading(false);
        }
    };

    const isMyProfile = Boolean(currentUser && user && currentUser.id === user.id);
    const isAdmin = Boolean(currentUser && Array.isArray(currentUser.roles) && currentUser.roles.some((role: any) => role.role === RoleEnum.ADMINISTRATOR));

    return {
        user, currentUser, friendship, loading, error, statusLoading,
        handleAddFriend, handleUpdateFriendStatus, handleChangeUserStatus,
        isMyProfile, isAdmin
    };
}