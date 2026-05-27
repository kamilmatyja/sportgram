import { useState } from 'react';
import { TrainingProvider } from '../../api/providers/TrainingProvider';
import { StatusBody } from '../../api/body/StatusBody';

export function useTrainingInteractions(refreshTrainings: () => void) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const trainingProvider = new TrainingProvider();

    const handleParticipantStatusSubmit = async (participantId: string, newStatus: number) => {
        setActionLoading(participantId);
        try {
            await trainingProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            refreshTrainings();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        actionLoading,
        handleParticipantStatusSubmit
    };
}