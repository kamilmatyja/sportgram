import React, { useEffect, useState } from 'react';
import { UserService } from '../api/UserService';
import { useTranslation } from '../context/TranslationContext';
import UsersView from '../components/UsersView';

const defaultFilters = {
    firstName: '',
    lastName: '',
    gender: '',
    email: '',
    country: '',
    status: '',
    link: '',
};

function buildQuery({ page, limit, sort, filters }) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (sort) params.append('sort', sort);
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(`filter[${key}]`, value);
    });
    return params.toString();
}

export default function Users() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState('createdAt:desc');
    const [filters, setFilters] = useState(defaultFilters);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, [page, limit, sort, filters]);

    async function fetchUsers() {
        setLoading(true);
        setError(null);
        try {
            const query = buildQuery({ page, limit, sort, filters });
            const data = await UserService.getUsers(query);
            setUsers(data.elements || data);
            setTotal(data.total ?? 0);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    function handleFilterChange(e) {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    }

    function handleSortChange(e) {
        setSort(e.target.value);
    }

    function handleLimitChange(e) {
        setLimit(Number(e.target.value));
        setPage(1);
    }

    function handlePrevPage() {
        setPage(page - 1);
    }
    function handleNextPage() {
        setPage(page + 1);
    }

    return (
        <UsersView
            t={t}
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
