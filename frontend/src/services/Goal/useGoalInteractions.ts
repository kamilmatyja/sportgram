import { useState } from 'react';
import { GoalProvider } from '../../api/providers/GoalProvider';
import { StatusBody } from '../../api/body/StatusBody';

export function useGoalInteractions(refreshGoals: () => void) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const goalProvider = new GoalProvider();

    const handleParticipantStatusSubmit = async (participantId: string, newStatus: number) => {
        setActionLoading(participantId);
        try {
            await goalProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            refreshGoals();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleResultStatusSubmit = async (resultId: string, newStatus: number) => {
        setActionLoading(resultId);
        try {
            await goalProvider.updateParticipantResultStatus(resultId, new StatusBody(newStatus));
            refreshGoals();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        actionLoading,
        handleParticipantStatusSubmit,
        handleResultStatusSubmit
    };
}