import { StatusBody } from '../../api/body/StatusBody';
import { TrainingProvider } from '../../api/providers/TrainingProvider';
import { useSafeAction } from '../Common/useSafeAction';

export type TrainingInteractions = ReturnType<typeof useTrainingInteractions>;

export function useTrainingInteractions(refreshTrainings: () => void) {
    const { actionLoading, actionError, runSafeAction } = useSafeAction();
    const trainingProvider = new TrainingProvider();

    const handleParticipantStatusSubmit = (participantId: string, newStatus: number) =>
        runSafeAction(participantId, async () => {
            await trainingProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            refreshTrainings();
        });

    return {
        actionLoading,
        actionError,
        handleParticipantStatusSubmit,
    };
}
