import React, {useEffect, useState} from 'react';
import {PageProvider} from '../../api/providers/PageProvider';
import {PageResponse} from '../../api/responses/PageResponse';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../../api/queries/PageIndexQuery';
import {useCheckPermission} from '../../utils/checkPermission';
import {RoleEnum} from '../../enums/RoleEnum';
import {UserResponse} from '../../api/responses/UserResponse';

export function usePages() {
    const {getCurrentUser} = useCheckPermission();
    const pageProvider = new PageProvider();

    const [pages, setPages] = useState<PageResponse[]>([]);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new PageFilterQuery());

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPages = async () => {
        setLoading(true);
        setError(null);
        try {
            const filterDto = new PageFilterQuery();
            filterDto.title = filters.title;
            filterDto.link = filters.link;
            filterDto.status = filters.status ? Number(filters.status) : undefined;

            const indexDto = new PageIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await pageProvider.index(indexDto);
            setPages(data);
        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const currentUsr = await getCurrentUser();
                setCurrentUser(currentUsr);

                if (currentUsr) {
                    setIsOrganizer(currentUsr.roles?.some((r: any) => r.role === RoleEnum.ORGANIZER) ?? false);
                    setIsAdmin(currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false);
                }

                await fetchPages();
            } catch (err: any) {
                setError(err.error);
                setLoading(false);
            }
        };

        init();
    }, [page, limit, sort, filters]);

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

    return {
        pages, currentUser, isOrganizer, isAdmin, page, limit, sort, filters, loading, error,
        handleFilterChange, handleSortChange, handleLimitChange, handlePrevPage, handleNextPage, fetchPages
    };
}