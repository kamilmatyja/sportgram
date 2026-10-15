import { FriendBody } from '../../api/body/FriendBody';
import { StatusBody } from '../../api/body/StatusBody';
import { FriendProvider } from '../../api/providers/FriendProvider';
import { useTranslation } from '../../context/TranslationContext';
import { getErrorMessage } from '../../utils/api';
import { useActionState } from '../../utils/hooks/useActionState';
import { useAppAccess } from '../../utils/hooks/useAppAccess';

export function useUserProfile(link?: string) {
    const { t } = useTranslation();
    const access = useAppAccess({ targetLink: link, requireFriendship: false });
    const { actionLoading, runAction } = useActionState();

    const friendProvider = new FriendProvider();

    const runFriendAction = (id: string, action: () => Promise<unknown>) =>
        runAction(id, async () => {
            await action();
            await access.refreshAccess();
        }).catch((err: unknown) => alert(t(getErrorMessage(err))));

    const handleAddFriend = () => {
        if (!access.targetUser || !access.currentUser) return;
        const targetUserId = access.targetUser.id;
        return runFriendAction('add-friend', () => friendProvider.create(new FriendBody(targetUserId)));
    };

    const handleUpdateFriendStatus = (newStatus: number) => {
        if (!access.friendship || !access.targetUser) return;
        const friendshipId = access.friendship.id;
        return runFriendAction('update-friend', () =>
            friendProvider.updateStatus(friendshipId, new StatusBody(newStatus)),
        );
    };

    return {
        ...access,
        user: access.targetUser,
        loading: access.authLoading,
        error: access.authError,
        actionLoading: actionLoading !== null,
        handleAddFriend,
        handleUpdateFriendStatus,
        refreshProfile: access.refreshAccess,
    };
}
