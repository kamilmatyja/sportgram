import {useEffect, useState} from 'react';
import {StoryProvider} from '../../api/providers/StoryProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {StoryResponse} from '../../api/responses/StoryResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {StoryFilterQuery} from '../../api/queries/StoryFilterQuery';
import {StoryIndexQuery} from '../../api/queries/StoryIndexQuery';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {useDataFetch} from '../../utils/hooks/useDataFetch';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';

export function useFeedStories(targetUserId?: string) {
    const accessOptions = targetUserId ? { targetId: targetUserId, requireFriendship: true } : {};
    const access = useAppAccess(accessOptions);

    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const { data: stories, loading, error, executeFetch } = useDataFetch<StoryResponse[]>();

    const storyProvider = new StoryProvider();
    const userProvider = new UserProvider();

    const fetchStories = () => {
        executeFetch(async () => {
            const filterDto = new StoryFilterQuery();
            filterDto.status = ElementStatusEnum.ACTIVE;
            if (targetUserId) {
                filterDto.userId = targetUserId;
            }

            const indexDto = new StoryIndexQuery();
            indexDto.limit = 100;
            indexDto.filter = filterDto;

            const data = await storyProvider.index(indexDto);

            const userIds = data.map(s => s.userId);
            const updatedUsers = await fetchRelatedUsers(userIds, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

            return data;
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchStories();
        }
    }, [access.authLoading, access.authError, targetUserId]);

    return {
        stories: stories || [],
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        currentUser: access.currentUser
    };
}