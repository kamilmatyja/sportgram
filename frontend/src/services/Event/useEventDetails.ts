import { useEffect, useState } from 'react';

import { StatusBody } from '../../api/body/StatusBody';
import { EventProvider } from '../../api/providers/EventProvider';
import { PageProvider } from '../../api/providers/PageProvider';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventIndexQuery } from '../../api/queries/EventIndexQuery';
import { EVENT_INCLUDES } from '../../api/queries/includes';
import { PageIndexQuery } from '../../api/queries/PageIndexQuery';
import { EventDisciplineDistanceListResponse } from '../../api/responses/EventDisciplineDistanceListResponse';
import { EventResponse } from '../../api/responses/EventResponse';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { getErrorMessage } from '../../utils/api';
import { fetchDistanceLists } from '../../utils/fetchDistanceLists';
import { useActionState } from '../../utils/hooks/useActionState';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { firstOrNotFound } from '../../utils/query';

async function findPageByParticipantId(pageParticipantId: string): Promise<PageResponse | null> {
    const pageProvider = new PageProvider();
    const indexDto = new PageIndexQuery();
    indexDto.limit = PaginationEnum.LG;
    indexDto.include = ['pageParticipants'];

    for (let page = 1; ; page++) {
        indexDto.page = page;
        const response = await pageProvider.index(indexDto);
        const found = response.data.find((p) => p.participants?.some((part) => part.id === pageParticipantId));
        if (found) return found;
        if (!response.pagination.hasNextPage || response.data.length === 0) return null;
    }
}

export function useEventDetails(link?: string) {
    const { t } = useTranslation();
    const access = useAppAccess();
    const { actionLoading, runAction } = useActionState();

    const { data: eventObj, loading: eventLoading, error: eventError, executeFetch } = useDataFetch<EventResponse>();
    const {
        data: distanceLists,
        loading: listsLoading,
        executeFetch: executeListsFetch,
    } = useDataFetch<EventDisciplineDistanceListResponse[]>();

    const [ownerPage, setOwnerPage] = useState<PageResponse | null>(null);
    const [showListsModal, setShowListsModal] = useState(false);
    const [selectedDistanceId, setSelectedDistanceId] = useState<string>('');
    const [listUsers, setListUsers] = useState<Record<string, UserResponse>>({});

    const eventProvider = new EventProvider();

    const fetchEventData = () => {
        const currentUser = access.currentUser;
        if (!link || !currentUser) return;

        executeFetch(async () => {
            const filterDto = new EventFilterQuery();
            filterDto.link = link;
            const indexDto = new EventIndexQuery();
            indexDto.filter = filterDto;
            indexDto.include = EVENT_INCLUDES;

            const targetEvent = firstOrNotFound(await eventProvider.index(indexDto));

            const page = await findPageByParticipantId(targetEvent.pageParticipantId);
            if (!page) throw { error: 'notFound.message' };
            setOwnerPage(page);

            return targetEvent;
        });
    };

    useEffect(() => {
        if (isAccessReady(access)) {
            fetchEventData();
        }
    }, [link, access.authLoading, access.authError]);

    const refreshLists = (distanceId: string) =>
        executeListsFetch(async () => {
            const { lists, users } = await fetchDistanceLists(distanceId, listUsers);
            setListUsers(users);
            return lists;
        }, []);

    const openListsModal = (distanceId: string) => {
        setSelectedDistanceId(distanceId);
        setShowListsModal(true);
        refreshLists(distanceId);
    };

    const closeListsModal = () => {
        setShowListsModal(false);
        setSelectedDistanceId('');
    };

    const runListAction = (action: () => Promise<unknown>) =>
        runAction('list', action).catch((err: unknown) => alert(t(getErrorMessage(err))));

    const handleEnroll = (distanceId: string) =>
        runListAction(async () => {
            await eventProvider.createList(distanceId);
            if (selectedDistanceId === distanceId) {
                await refreshLists(distanceId);
            }
        });

    const handleListStatusUpdate = (listId: string, status: number) =>
        runListAction(async () => {
            await eventProvider.updateListStatus(listId, new StatusBody(status));
            await refreshLists(selectedDistanceId);
        });

    const handleDeleteList = (listId: string) =>
        runListAction(async () => {
            await eventProvider.deleteList(listId);
            await refreshLists(selectedDistanceId);
        });

    return {
        ...access,
        eventObj,
        ownerPage,
        isMyProfile: !!ownerPage?.participants?.some((part) => part.userId === access.currentUser?.id),
        loading: access.authLoading || eventLoading,
        error: access.authError || eventError,
        showListsModal,
        openListsModal,
        closeListsModal,
        selectedDistanceId,
        distanceLists: distanceLists || [],
        listUsers,
        listsLoading,
        actionLoading: actionLoading !== null,
        handleEnroll,
        handleListStatusUpdate,
        handleDeleteList,
        refreshEvent: fetchEventData,
        refreshLists,
    };
}
