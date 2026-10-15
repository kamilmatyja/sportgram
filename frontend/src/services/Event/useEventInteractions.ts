import { EventResultBody } from '../../api/body/EventResultBody';
import { StatusBody } from '../../api/body/StatusBody';
import { EventProvider } from '../../api/providers/EventProvider';
import { fetchDistanceLists } from '../../utils/fetchDistanceLists';
import { useFormState } from '../../utils/hooks/useFormState';
import { useSafeAction } from '../Common/useSafeAction';

export type EventInteractions = ReturnType<typeof useEventInteractions>;

export function useEventInteractions(refreshEvents: () => void) {
    const { actionLoading, actionError, runAction, runSafeAction } = useSafeAction();
    const resultForm = useFormState();
    const eventProvider = new EventProvider();

    const handleListStatusSubmit = (listId: string, status: number) =>
        runSafeAction(listId, async () => {
            await eventProvider.updateListStatus(listId, new StatusBody(status));
            refreshEvents();
        });

    const handleSaveResult = (listId: string, resultId: string | null, formData: EventResultBody) =>
        runAction(listId, () =>
            resultForm.wrap(() =>
                resultId
                    ? eventProvider.updateResult(resultId, formData)
                    : eventProvider.createResult(listId, formData),
            ),
        )
            .then(() => true)
            .catch(() => false);

    const handleDeleteResult = (resultId: string) =>
        runSafeAction('delete_result', () => eventProvider.deleteResult(resultId));

    return {
        actionLoading,
        actionError,
        fetchDistanceLists: (distanceId: string) => fetchDistanceLists(distanceId),
        handleListStatusSubmit,
        handleSaveResult,
        handleDeleteResult,
        resultFieldErrors: resultForm.fieldErrors,
        resultGlobalError: resultForm.globalError,
        resetResultErrors: resultForm.resetErrors,
    };
}
