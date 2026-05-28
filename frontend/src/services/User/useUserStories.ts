import React, {useEffect, useState} from 'react';
import {StoryProvider} from '../../api/providers/StoryProvider';
import {StoryResponse} from '../../api/responses/StoryResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {StoryFilterQuery} from '../../api/queries/StoryFilterQuery';
import {StoryIndexQuery} from '../../api/queries/StoryIndexQuery';
import {profileAccess} from '../../utils/profileAccess.ts';

export function useUserStories(link?: string) {
    const {checkAccess} = profileAccess();

    const [stories, setStories] = useState<StoryResponse[]>([]);
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new StoryFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const storyProvider = new StoryProvider();

    const fetchStories = async (userId: string) => {
        setLoading(true);
        setError(null);
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
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                if (!link) {
                    setError('userNotFound');
                    return;
                }

                const access = await checkAccess({ link }, { requireFriendship: true });

                setTargetUser(access.targetUser);
                setIsAdmin(access.isAdmin);
                setIsMyProfile(access.isMyProfile);

                await fetchStories(access.targetUser.id);
            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [link, page, limit, sort, filters]);

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
        if (targetUser) fetchStories(targetUser.id);
    };

    return {
        stories, targetUser, isMyProfile, isAdmin, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, refreshStories
    };
}