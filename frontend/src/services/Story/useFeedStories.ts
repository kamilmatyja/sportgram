import { useEffect } from 'react';

import { StoryProvider } from '../../api/providers/StoryProvider';
import { StoryFilterQuery } from '../../api/queries/StoryFilterQuery';
import { StoryIndexQuery } from '../../api/queries/StoryIndexQuery';
import { StoryResponse } from '../../api/responses/StoryResponse';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';

export function useFeedStories(targetUserId?: string) {
    const access = useAppAccess(targetUserId ? { targetId: targetUserId, requireFriendship: true } : {});
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();
    const { data: stories, loading, error, executeFetch } = useDataFetch<StoryResponse[]>();

    const storyProvider = new StoryProvider();

    const fetchStories = () => {
        executeFetch(async () => {
            const filterDto = new StoryFilterQuery();
            filterDto.status = ElementStatusEnum.ACTIVE;
            filterDto.userId = targetUserId;

            const indexDto = new StoryIndexQuery();
            indexDto.limit = PaginationEnum.LG;
            indexDto.filter = filterDto;

            const data = (await storyProvider.index(indexDto)).data;
            await loadRelatedUsers(data.map((s) => s.userId));

            return data;
        }, []);
    };

    useEffect(() => {
        const targetReady = !targetUserId || access.targetUser?.id === targetUserId;
        if (isAccessReady(access) && targetReady) {
            fetchStories();
        }
    }, [access.authLoading, access.authError, access.targetUser, targetUserId]);

    return {
        stories: stories || [],
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
    };
}
