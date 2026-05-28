import {TrainingProvider} from '../../api/providers/TrainingProvider';
import {StatusBody} from '../../api/body/StatusBody';
import {useActionState} from '../../utils/hooks/useActionState';

export function useTrainingInteractions(refreshTrainings: () => void) {
    const { actionLoading, runAction } = useActionState();
    const trainingProvider = new TrainingProvider();

    const handleParticipantStatusSubmit = (participantId: string, newStatus: number) => {
        runAction(participantId, async () => {
            await trainingProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            refreshTrainings();
        }).catch(() => {});
    };

    return {
        actionLoading,
        handleParticipantStatusSubmit
    };
}