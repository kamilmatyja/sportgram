import {useState} from 'react';
import {EventProvider} from '../../api/providers/EventProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {StatusBody} from '../../api/body/StatusBody';
import {EventResultBody} from '../../api/body/EventResultBody';
import {EventListIndexQuery} from '../../api/queries/EventListIndexQuery';
import {UserResponse} from '../../api/responses/UserResponse';
import {EventDisciplineDistanceListResponse} from '../../api/responses/EventDisciplineDistanceListResponse';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';

export function useEventInteractions(refreshEvents: () => void) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const eventProvider = new EventProvider();
    const userProvider = new UserProvider();

    const fetchDistanceLists = async (distId: string): Promise<{
        lists: EventDisciplineDistanceListResponse[],
        users: Record<string, UserResponse>
    }> => {
        const indexQuery = new EventListIndexQuery();
        indexQuery.limit = 100;
        const lists = await eventProvider.indexList(distId, indexQuery);

        const detailedLists = await Promise.all(lists.map(async (l) => {
            return await eventProvider.detailsList(l.id, ['eventListResults', 'eventListSubResults']);
        }));

        const userIds = detailedLists.map(l => l.userId);
        const usersMap = await fetchRelatedUsers(userIds, {}, userProvider);

        return {lists: detailedLists, users: usersMap};
    };

    const handleListStatusSubmit = async (listId: string, status: number) => {
        setActionLoading(listId);
        try {
            await eventProvider.updateListStatus(listId, new StatusBody(status));
            refreshEvents();
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            setActionLoading(null);
        }
    };

    const handleSaveResult = async (listId: string, resultId: string | null, formData: EventResultBody) => {
        setActionLoading(listId);
        try {
            if (resultId) {
                await eventProvider.updateResult(resultId, formData);
            } else {
                await eventProvider.createResult(listId, formData);
            }
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteResult = async (resultId: string) => {
        setActionLoading('delete_result');
        try {
            await eventProvider.deleteResult(resultId);
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            setActionLoading(null);
        }
    };

    return {
        actionLoading,
        fetchDistanceLists,
        handleListStatusSubmit,
        handleSaveResult,
        handleDeleteResult
    };
}