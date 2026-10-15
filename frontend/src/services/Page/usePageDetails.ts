import { useEffect, useState } from 'react';

import { StatusBody } from '../../api/body/StatusBody';
import { EventProvider } from '../../api/providers/EventProvider';
import { PageProvider } from '../../api/providers/PageProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventIndexQuery } from '../../api/queries/EventIndexQuery';
import { PAGE_INCLUDES } from '../../api/queries/includes';
import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { PageIndexQuery } from '../../api/queries/PageIndexQuery';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { getErrorMessage } from '../../utils/api';
import { useActionState } from '../../utils/hooks/useActionState';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { firstOrNotFound, toOptionalNumber } from '../../utils/query';

export function usePageDetails(link?: string) {
    const { t } = useTranslation();
    const access = useAppAccess();
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const { actionLoading, runAction } = useActionState();

    const { data: pageObj, loading: pageLoading, error: pageError, executeFetch } = useDataFetch<PageResponse>();
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);

    const pageProvider = new PageProvider();
    const userProvider = new UserProvider();
    const eventProvider = new EventProvider();

    const {
        list: eventsList,
        items: events,
        loading: eventsLoading,
    } = usePaginatedList({
        initialFilter: new EventFilterQuery(),
        scope: pageObj,
        fetchPage: async (list, page) => {
            const filterDto = new EventFilterQuery();
            filterDto.pageId = page.id;
            filterDto.title = list.filters.title;
            filterDto.status = toOptionalNumber(list.filters.status);

            return list.applyPagination(
                await eventProvider.index(list.buildIndexQuery(new EventIndexQuery(), filterDto)),
            );
        },
    });

    const fetchPageData = () => {
        if (!link || !access.currentUser) return;

        executeFetch(async () => {
            const filterDto = new PageFilterQuery();
            filterDto.link = link;
            const indexDto = new PageIndexQuery();
            indexDto.filter = filterDto;
            indexDto.include = PAGE_INCLUDES;

            const targetPage = firstOrNotFound(await pageProvider.index(indexDto));

            setOwnerUser(await userProvider.details(targetPage.userId));
            await loadRelatedUsers([
                ...targetPage.participants.map((p) => p.userId),
                ...(targetPage.follows?.map((f) => f.userId) || []),
            ]);

            return targetPage;
        });
    };

    useEffect(() => {
        if (isAccessReady(access)) {
            fetchPageData();
        }
    }, [link, access.authLoading, access.authError]);

    const currentUserId = access.currentUser?.id;
    const myFollow = pageObj?.follows?.find((f) => f.userId === currentUserId) || null;

    const handleToggleFollow = () => {
        if (!pageObj || !access.currentUser) return;
        runAction('follow', async () => {
            if (!myFollow) {
                await pageProvider.createFollow(pageObj.id, new StatusBody(PageFollowStatusEnum.ACCEPTED));
            } else {
                const newStatus =
                    myFollow.status === PageFollowStatusEnum.ACCEPTED
                        ? PageFollowStatusEnum.UNFOLLOWED
                        : PageFollowStatusEnum.ACCEPTED;
                await pageProvider.updateFollowStatus(myFollow.id, new StatusBody(newStatus));
            }
            fetchPageData();
        }).catch((err: unknown) => alert(t(getErrorMessage(err))));
    };

    return {
        ...access,
        pageObj,
        ownerUser,
        relatedUsers,
        isMyProfile: !!pageObj && pageObj.userId === currentUserId,
        myFollow,
        followLoading: actionLoading !== null,
        handleToggleFollow,
        loading: access.authLoading || pageLoading,
        error: access.authError || pageError,
        events,
        eventsLoading,
        eventPage: eventsList.page,
        eventLimit: eventsList.limit,
        eventHasMore: eventsList.hasMore,
        eventSort: eventsList.sort,
        eventFilters: eventsList.filters,
        handleEventFilterChange: eventsList.handleFilterChange,
        handleEventSortChange: eventsList.handleSortChange,
        handleEventLimitChange: eventsList.handleLimitChange,
        handleEventPrevPage: eventsList.handlePrevPage,
        handleEventNextPage: eventsList.handleNextPage,
        refreshPage: fetchPageData,
    };
}
