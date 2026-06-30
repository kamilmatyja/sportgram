import { StatusBody } from '../../api/body/StatusBody';
import { PageProvider } from '../../api/providers/PageProvider';
import { useActionState } from '../../utils/hooks/useActionState';

export function usePageInteractions(refreshPages: () => void) {
    const { actionLoading, runAction } = useActionState();
    const pageProvider = new PageProvider();

    const handleParticipantStatusSubmit = (participantId: string, newStatus: number) => {
        runAction(participantId, async () => {
            await pageProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            refreshPages();
        }).catch(() => {});
    };

    const handleFollowStatusSubmit = (followId: string, newStatus: number) => {
        runAction(followId, async () => {
            await pageProvider.updateFollowStatus(followId, new StatusBody(newStatus));
            refreshPages();
        }).catch(() => {});
    };

    return {
        actionLoading,
        handleParticipantStatusSubmit,
        handleFollowStatusSubmit,
    };
}
