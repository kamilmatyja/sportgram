import { StatusBody } from '../../api/body/StatusBody';
import { GoalProvider } from '../../api/providers/GoalProvider';
import { useActionState } from '../../utils/hooks/useActionState';

export function useGoalInteractions(refreshGoals: () => void) {
    const { actionLoading, runAction } = useActionState();
    const goalProvider = new GoalProvider();

    const handleParticipantStatusSubmit = (participantId: string, newStatus: number) => {
        runAction(participantId, async () => {
            await goalProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            refreshGoals();
        }).catch(() => {});
    };

    const handleResultStatusSubmit = (resultId: string, newStatus: number) => {
        runAction(resultId, async () => {
            await goalProvider.updateParticipantResultStatus(resultId, new StatusBody(newStatus));
            refreshGoals();
        }).catch(() => {});
    };

    return {
        actionLoading,
        handleParticipantStatusSubmit,
        handleResultStatusSubmit,
    };
}
