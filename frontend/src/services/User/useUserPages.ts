import {useEffect, useState} from 'react';
import {PageProvider} from '../../api/providers/PageProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../../api/queries/PageIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useListFilters} from '../../utils/hooks/useListFilters';
import {useDataFetch} from '../../utils/hooks/useDataFetch';

export function useUserPages(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });
    const list = useListFilters(new PageFilterQuery());

    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const { data: pages, loading, error, executeFetch } = useDataFetch<PageResponse[]>();

    const userProvider = new UserProvider();
    const pageProvider = new PageProvider();

    const fetchPages = (userId: string) => {
        executeFetch(async () => {
            const filterDto = new PageFilterQuery();
            filterDto.userId = userId;
            filterDto.title = list.filters.title;
            filterDto.link = list.filters.link;
            filterDto.status = list.filters.status ? Number(list.filters.status) : undefined;

            const indexDto = new PageIndexQuery();
            indexDto.page = list.page;
            indexDto.limit = list.limit;
            indexDto.sort = list.sort;
            indexDto.filter = filterDto;
            indexDto.include = ['pageParticipants', 'pageFollows'];

            const data = await pageProvider.index(indexDto);

            const userIds = data.flatMap(p => [
                ...p.participants.map(part => part.userId),
                ...(p.follows?.map(f => f.userId) || [])
            ]);

            const updatedUsers = await fetchRelatedUsers(userIds, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

            return data;
        }, []);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError && access.targetUser) {
            fetchPages(access.targetUser.id);
        }
    }, [access.authLoading, access.authError, access.targetUser, list.page, list.limit, list.sort, list.filters]);

    const refreshPages = () => {
        if (access.targetUser) fetchPages(access.targetUser.id);
    };

    return {
        ...access,
        ...list,
        pages: pages || [],
        relatedUsers,
        loading: access.authLoading || loading,
        error: access.authError || error,
        refreshPages
    };
}