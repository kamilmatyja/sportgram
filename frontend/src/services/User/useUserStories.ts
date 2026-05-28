import React, {useEffect, useState} from 'react';
import {StoryProvider} from '../../api/providers/StoryProvider';
import {StoryResponse} from '../../api/responses/StoryResponse';
import {StoryFilterQuery} from '../../api/queries/StoryFilterQuery';
import {StoryIndexQuery} from '../../api/queries/StoryIndexQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useUserStories(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [stories, setStories] = useState<StoryResponse[]>([]);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new StoryFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const storyProvider = new StoryProvider();

    const fetchStories = async (userId: string) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new StoryFilterQuery();
            filterDto.userId = userId;
            filterDto.text = filters.text;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new StoryIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
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

    const refreshStories = () => {
        if (access.targetUser) fetchStories(access.targetUser.id);
    };

    return {
        ...access,
        stories, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshStories
    };
}