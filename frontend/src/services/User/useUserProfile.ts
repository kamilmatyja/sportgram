import {useState} from 'react';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {FriendBody} from '../../api/body/FriendBody';
import {StatusBody} from '../../api/body/StatusBody';
import {useTranslation} from '../../context/TranslationContext';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useUserProfile(link?: string) {
    const {t} = useTranslation();
    const accessOptions = { targetLink: link, requireFriendship: false };
    const access = useAppAccess(accessOptions);

    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [triggerRefresh, setTriggerRefresh] = useState<number>(0);

    const friendProvider = new FriendProvider();

    const handleAddFriend = async () => {
        if (!access.targetUser || !access.currentUser) return;
        setActionLoading(true);
        try {
            await friendProvider.create(new FriendBody(access.targetUser.id));
            setTriggerRefresh(prev => prev + 1);
        } catch (e: any) {
            if (e.error) alert(t(e.error) !== e.error ? t(e.error) : e.error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateFriendStatus = async (newStatus: number) => {
        if (!access.friendship || !access.targetUser) return;
        setActionLoading(true);
        try {
            await friendProvider.updateStatus(access.friendship.id, new StatusBody(newStatus));
            setTriggerRefresh(prev => prev + 1);
        } catch (e: any) {
            if (e.error) alert(t(e.error) !== e.error ? t(e.error) : e.error);
        } finally {
            setActionLoading(false);
        }
    };

    const refreshProfile = () => {
        setTriggerRefresh(prev => prev + 1);
    };

    return {
        ...access,
        user: access.targetUser,
        loading: access.authLoading,
        error: access.authError,
        actionLoading,
        handleAddFriend, handleUpdateFriendStatus, refreshProfile,
        triggerRefresh
    };
}