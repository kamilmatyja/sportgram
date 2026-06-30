import { useEffect } from 'react';

import { StoryProvider } from '../../api/providers/StoryProvider';
import { StoryFilterQuery } from '../../api/queries/StoryFilterQuery';
import { StoryIndexQuery } from '../../api/queries/StoryIndexQuery';
import { StoryResponse } from '../../api/responses/StoryResponse';
import { useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useListFilters } from '../../utils/hooks/useListFilters';

export function useUserStories(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const list = useListFilters(new StoryFilterQuery());
    const storyProvider = new StoryProvider();

    const { data: stories, loading, error, executeFetch } = useDataFetch<StoryResponse[]>();

    const fetchStories = (userId: string) => {
        executeFetch(async () => {
            const filterDto = new StoryFilterQuery();
            filterDto.userId = userId;
            filterDto.text = list.filters.text;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new StoryIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            return await storyProvider.index(indexDto);
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchStories(access.targetUser.id);
        }
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshStories = () => {
        if (access.targetUser) fetchStories(access.targetUser.id);
    };

    return {
        ...access,
        ...list,
        stories: stories || [],
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshStories,
    };
}
