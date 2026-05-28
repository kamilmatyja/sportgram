import {useState} from 'react';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {FriendBody} from '../../api/body/FriendBody';
import {StatusBody} from '../../api/body/StatusBody';
import {useTranslation} from '../../context/TranslationContext';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useActionState} from '../../utils/hooks/useActionState';

export function useUserProfile(link?: string) {
    const {t} = useTranslation();
    const access = useAppAccess({ targetLink: link, requireFriendship: false });
    const { actionLoading, runAction } = useActionState();

    const [triggerRefresh, setTriggerRefresh] = useState<number>(0);
    const friendProvider = new FriendProvider();

    const handleAddFriend = () => {
        if (!access.targetUser || !access.currentUser) return;
        runAction('add-friend', async () => {
            await friendProvider.create(new FriendBody(access.targetUser!.id));
            setTriggerRefresh(prev => prev + 1);
        }).catch((e: any) => {
            if (e.error) alert(t(e.error) !== e.error ? t(e.error) : e.error);
        });
    };

    const handleUpdateFriendStatus = (newStatus: number) => {
        if (!access.friendship || !access.targetUser) return;
        runAction('update-friend', async () => {
            await friendProvider.updateStatus(access.friendship!.id, new StatusBody(newStatus));
            setTriggerRefresh(prev => prev + 1);
        }).catch((e: any) => {
            if (e.error) alert(t(e.error) !== e.error ? t(e.error) : e.error);
        });
    };

    const refreshProfile = () => setTriggerRefresh(prev => prev + 1);

    return {
        ...access,
        user: access.targetUser,
        loading: access.authLoading,
        error: access.authError,
        actionLoading: actionLoading !== null,
        handleAddFriend, handleUpdateFriendStatus, refreshProfile, triggerRefresh
    };
}