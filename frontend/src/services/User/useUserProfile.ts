import {useEffect, useState} from 'react';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {FriendBody} from '../../api/body/FriendBody';
import {StatusBody} from '../../api/body/StatusBody';
import {useTranslation} from '../../context/TranslationContext';
import {profileAccess} from '../../utils/profileAccess.ts';

export function useUserProfile(link?: string) {
    const {t} = useTranslation();
    const {checkAccess} = profileAccess();

    const [user, setUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [friendship, setFriendship] = useState<FriendResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const friendProvider = new FriendProvider();

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            if (!link) {
                setError('userNotFound');
                return;
            }

            const access = await checkAccess({ link }, { requireFriendship: false });

            setCurrentUser(access.currentUser);
            setUser(access.targetUser);
            setIsMyProfile(access.isMyProfile);
            setIsAdmin(access.isAdmin);
            setFriendship(access.friendship);
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

    return {
        user, currentUser, friendship, loading, actionLoading, error,
        handleAddFriend, handleUpdateFriendStatus,
        isMyProfile, isAdmin, refreshProfile
    };
}