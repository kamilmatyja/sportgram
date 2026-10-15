import { StoryProvider } from '../../api/providers/StoryProvider';
import { StoryFilterQuery } from '../../api/queries/StoryFilterQuery';
import { StoryIndexQuery } from '../../api/queries/StoryIndexQuery';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { usePaginatedList } from '../../utils/hooks/usePaginatedList';
import { toOptionalNumber } from '../../utils/query';

export function useUserStories(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const storyProvider = new StoryProvider();

    const { list, items, loading, error, refresh } = usePaginatedList({
        initialFilter: new StoryFilterQuery(),
        scope: isAccessReady(access) ? access.targetUser : null,
        fetchPage: async (list, targetUser) => {
            const filterDto = new StoryFilterQuery();
            filterDto.userId = targetUser.id;
            filterDto.text = list.filters.text;
            filterDto.status = toOptionalNumber(list.filters.status);

            return list.applyPagination(
                await storyProvider.index(list.buildIndexQuery(new StoryIndexQuery(), filterDto)),
            );
        },
    });

    return {
        ...access,
        ...list,
        stories: items,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshStories: refresh,
    };
}
