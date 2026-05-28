import React, {useEffect, useState} from 'react';
import {PageProvider} from '../../api/providers/PageProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../../api/queries/PageIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';

export function useUserPages(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [pages, setPages] = useState<PageResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new PageFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const userProvider = new UserProvider();
    const pageProvider = new PageProvider();

    const fetchPages = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new PageFilterQuery();
            filterDto.userId = userId;
            filterDto.title = filters.title;
            filterDto.link = filters.link;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new PageIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await pageProvider.index(indexDto);

            const detailedPages = await Promise.all(data.map(async (p) => {
                return await pageProvider.details(p.id, [
                    'pageParticipants',
                    'pageFollows'
                ]);
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
    }, [access.authLoading, access.authError, access.targetUser, page, limit, sort, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
        setPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPage(prev => prev + 1);

    const refreshPages = () => {
        if (access.targetUser) fetchPages(access.targetUser.id);
    };

    return {
        ...access,
        pages, relatedUsers, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshPages
    };
}