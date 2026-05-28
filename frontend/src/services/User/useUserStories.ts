import {useEffect, useState} from 'react';
import {StoryProvider} from '../../api/providers/StoryProvider';
import {StoryResponse} from '../../api/responses/StoryResponse';
import {StoryFilterQuery} from '../../api/queries/StoryFilterQuery';
import {StoryIndexQuery} from '../../api/queries/StoryIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useListFilters} from '../../utils/hooks/useListFilters';

export function useUserStories(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [stories, setStories] = useState<StoryResponse[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new StoryFilterQuery());
    const storyProvider = new StoryProvider();

    const fetchStories = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new StoryFilterQuery();
            filterDto.userId = userId;
            filterDto.text = list.filters.text;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new StoryIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;

            const data = await storyProvider.index(indexDto);
            setStories(data);
        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
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
        stories,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshStories
    };
}