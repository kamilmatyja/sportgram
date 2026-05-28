import React, {useEffect, useState} from 'react';
import {UserProvider} from '../../api/providers/UserProvider';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {UserResponse} from '../../api/responses/UserResponse';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';

export function useUsers() {
    const access = useAppAccess();

    const [users, setUsers] = useState<UserResponse[]>([]);

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState(new UserFilterQuery());

    const [dataLoading, setDataLoading] = useState<boolean>(false);
    const [dataError, setDataError] = useState<string | null>(null);

    const userProvider = new UserProvider();

    const fetchUsers = async () => {
        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new UserFilterQuery();
            filterDto.firstName = filters.firstName;
            filterDto.lastName = filters.lastName;
            filterDto.gender = filters.gender ? Number(filters.gender) : undefined;
            filterDto.email = filters.email;
            filterDto.country = filters.country ? Number(filters.country) : undefined;
            filterDto.status = filters.status ? Number(filters.status) : undefined;
            filterDto.link = filters.link;

            const indexDto = new UserIndexQuery();
            indexDto.page = page;
            indexDto.limit = limit;
            indexDto.sort = sort;
            indexDto.filter = filterDto;

            const data = await userProvider.index(indexDto);
            setUsers(data);
        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchUsers();
        }
    }, [access.authLoading, access.authError, page, limit, sort, filters]);

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
        ...access,
        users, page, limit, sort, filters,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        handleFilterChange, handleSortChange, handleLimitChange,
        handlePrevPage, handleNextPage, fetchUsers
    };
}