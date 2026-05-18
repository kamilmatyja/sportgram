import React, {useEffect, useState} from 'react';
import {UserService} from '../api/service/UserService';
import {UserIndexDto} from '../api/dto/UserIndexDto';
import {UserFilterDto} from '../api/dto/UserFilterDto';
import UsersView from '../components/UsersView';
import {UserResponse} from '../api/response/UserResponse';

export default function Users() {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [sort, setSort] = useState<string>('createdAt:desc');
    const [filters, setFilters] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        email: '',
        country: '',
        status: '',
        link: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const userService = new UserService();

    useEffect(() => {
        fetchUsers();
    }, [page, limit, sort, filters]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const filterDto = new UserFilterDto(
                filters.firstName || null,
                filters.lastName || null,
                filters.gender ? Number(filters.gender) : null,
                filters.email || null,
                filters.country ? Number(filters.country) : null,
                filters.status ? Number(filters.status) : null,
                null,
                filters.link || null
            );

            const indexDto = new UserIndexDto(page, limit, sort, filterDto);

            const data = await userService.index(indexDto);
            setUsers(data);
        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handlePrevPage = () => {
        setPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setPage(prev => prev + 1);
    };

    return (
        <UsersView
            filters={filters}
            onFilterChange={handleFilterChange}
            sort={sort}
            onSortChange={handleSortChange}
            limit={limit}
            onLimitChange={handleLimitChange}
            users={users}
            loading={loading}
            error={error}
            page={page}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
        />
    );
}