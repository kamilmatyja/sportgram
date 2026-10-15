import { StatusBody } from '../../api/body/StatusBody';
import { GoalProvider } from '../../api/providers/GoalProvider';
import { useSafeAction } from '../Common/useSafeAction';

export type GoalInteractions = ReturnType<typeof useGoalInteractions>;

export function useGoalInteractions(refreshGoals: () => void) {
    const { actionLoading, actionError, runSafeAction } = useSafeAction();
    const goalProvider = new GoalProvider();

    const handleParticipantStatusSubmit = (participantId: string, newStatus: number) =>
        runSafeAction(participantId, async () => {
            await goalProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            refreshGoals();
        });

    const handleResultStatusSubmit = (resultId: string, newStatus: number) =>
        runSafeAction(resultId, async () => {
            await goalProvider.updateParticipantResultStatus(resultId, new StatusBody(newStatus));
            refreshGoals();
        });

    return {
        actionLoading,
        actionError,
        handleParticipantStatusSubmit,
        handleResultStatusSubmit,
    };
}
