import { useState } from 'react';
import { PageProvider } from '../api/providers/PageProvider';
import { StatusBody } from '../api/body/StatusBody';

export function usePageInteractions(refreshPages: () => void) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const pageProvider = new PageProvider();

    const handleParticipantStatusSubmit = async (participantId: string, newStatus: number) => {
        setActionLoading(participantId);
        try {
            await pageProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            refreshPages();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFollowStatusSubmit = async (followId: string, newStatus: number) => {
        setActionLoading(followId);
        try {
            await pageProvider.updateFollowStatus(followId, new StatusBody(newStatus));
            refreshPages();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        actionLoading,
        handleParticipantStatusSubmit,
        handleFollowStatusSubmit
    };
}