import { useState } from 'react';

import { EventResultBody } from '../../api/body/EventResultBody';
import { EventDisciplineDistanceListResponse } from '../../api/responses/EventDisciplineDistanceListResponse';
import { EventDisciplineSubDistanceResponse } from '../../api/responses/EventDisciplineSubDistanceResponse';
import { EventInteractions } from './useEventInteractions';

export type ListResultsState = ReturnType<typeof useListResults>;

export function useListResults(
    subDistances: EventDisciplineSubDistanceResponse[],
    interactions: EventInteractions,
    refreshLists: () => void,
) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [activeResultId, setActiveResultId] = useState<string | null>(null);
    const [formData, setFormData] = useState<EventResultBody>(() => new EventResultBody(0, []));

    const isFormOpen = (listId: string) => activeListId === listId;
    const isExpanded = (listId: string) => expandedRows[listId] || isFormOpen(listId);

    const toggleRow = (listId: string) => {
        if (isFormOpen(listId)) setActiveListId(null);
        setExpandedRows((prev) => ({ ...prev, [listId]: !prev[listId] }));
    };

    const openForm = (listId: string, resultId: string | null, body: EventResultBody) => {
        setFormData(body);
        interactions.resetResultErrors();
        setActiveResultId(resultId);
        setActiveListId(listId);
        setExpandedRows((prev) => ({ ...prev, [listId]: true }));
    };

    const openAddForm = (list: EventDisciplineDistanceListResponse) =>
        openForm(
            list.id,
            null,
            new EventResultBody(
                0,
                subDistances.map((sd) => ({ eventDisciplineSubDistanceId: sd.id, time: 0 })),
            ),
        );

    const openEditForm = (list: EventDisciplineDistanceListResponse, resultId: string) => {
        const result = list.results?.find((r) => r.id === resultId);
        if (!result) return;
        openForm(
            list.id,
            resultId,
            new EventResultBody(
                result.time,
                result.subResults?.map((sr) => ({
                    eventDisciplineSubDistanceId: sr.eventDisciplineSubDistanceId,
                    time: sr.time,
                })) || [],
            ),
        );
    };

    const resetActiveList = () => setActiveListId(null);

    const closeForm = () => {
        interactions.resetResultErrors();
        resetActiveList();
    };

    const saveResult = async () => {
        if (!activeListId) return;
        const saved = await interactions.handleSaveResult(activeListId, activeResultId, formData);
        if (!saved) return;
        resetActiveList();
        refreshLists();
    };

    const deleteResult = async (resultId: string) => {
        if (await interactions.handleDeleteResult(resultId)) {
            refreshLists();
        }
    };

    return {
        formData,
        setFormData,
        isFormOpen,
        isExpanded,
        toggleRow,
        openAddForm,
        openEditForm,
        closeForm,
        saveResult,
        deleteResult,
        resetActiveList,
    };
}
