import { StatusBody } from '../../api/body/StatusBody';
import { PageProvider } from '../../api/providers/PageProvider';
import { useSafeAction } from '../Common/useSafeAction';

export type PageInteractions = ReturnType<typeof usePageInteractions>;

export function usePageInteractions(refreshPages: () => void) {
    const { actionLoading, actionError, runSafeAction } = useSafeAction();
    const pageProvider = new PageProvider();

    const handleParticipantStatusSubmit = (participantId: string, newStatus: number) =>
        runSafeAction(participantId, async () => {
            await pageProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            refreshPages();
        });

    const handleFollowStatusSubmit = (followId: string, newStatus: number) =>
        runSafeAction(followId, async () => {
            await pageProvider.updateFollowStatus(followId, new StatusBody(newStatus));
            refreshPages();
        });

    return {
        actionLoading,
        actionError,
        handleParticipantStatusSubmit,
        handleFollowStatusSubmit,
    };
}
