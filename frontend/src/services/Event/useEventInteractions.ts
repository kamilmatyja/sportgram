import { EventResultBody } from '../../api/body/EventResultBody';
import { StatusBody } from '../../api/body/StatusBody';
import { EventProvider } from '../../api/providers/EventProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { EventListIndexQuery } from '../../api/queries/EventListIndexQuery';
import { EventDisciplineDistanceListResponse } from '../../api/responses/EventDisciplineDistanceListResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { fetchRelatedUsers } from '../../utils/fetchRelatedUsers';
import { useActionState } from '../../utils/hooks/useActionState';

export function useEventInteractions(refreshEvents: () => void) {
    const { actionLoading, runAction } = useActionState();
    const eventProvider = new EventProvider();
    const userProvider = new UserProvider();

    const fetchDistanceLists = async (
        distId: string,
    ): Promise<{
        lists: EventDisciplineDistanceListResponse[];
        users: Record<string, UserResponse>;
    }> => {
        const indexQuery = new EventListIndexQuery();
        indexQuery.limit = 100;
        indexQuery.include = ['eventListResults', 'eventListSubResults'];
        const lists = await eventProvider.indexList(distId, indexQuery);

        const userIds = lists.map((l) => l.userId);
        const usersMap = await fetchRelatedUsers(userIds, {}, userProvider);

        return { lists: lists, users: usersMap };
    };

    const handleListStatusSubmit = (listId: string, status: number) => {
        runAction(listId, async () => {
            await eventProvider.updateListStatus(listId, new StatusBody(status));
            refreshEvents();
        }).catch(() => {});
    };

    const handleSaveResult = (listId: string, resultId: string | null, formData: EventResultBody) => {
        runAction(listId, async () => {
            if (resultId) {
                await eventProvider.updateResult(resultId, formData);
            } else {
                await eventProvider.createResult(listId, formData);
            }
        }).catch(() => {});
    };

    const handleDeleteResult = (resultId: string) => {
        runAction('delete_result', async () => {
            await eventProvider.deleteResult(resultId);
        }).catch(() => {});
    };

    return {
        actionLoading,
        fetchDistanceLists,
        handleListStatusSubmit,
        handleSaveResult,
        handleDeleteResult,
    };
}
