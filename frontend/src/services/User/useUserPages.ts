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

export function useUserPages(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [pages, setPages] = useState<PageResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const list = useListFilters(new PageFilterQuery());

    const userProvider = new UserProvider();
    const pageProvider = new PageProvider();

    const fetchPages = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
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

            const data = await pageProvider.index(indexDto);

            const detailedPages = await Promise.all(data.map(async (p) => {
                return await pageProvider.details(p.id, ['pageParticipants', 'pageFollows']);
            }));

            setPages(detailedPages);

            const userIds = detailedPages.flatMap(p => [
                ...p.participants.map(part => part.userId),
                ...(p.follows?.map(f => f.userId) || [])
            ]);

            const updatedUsers = await fetchRelatedUsers(userIds, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
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
        pages, relatedUsers,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        refreshPages
    };
}