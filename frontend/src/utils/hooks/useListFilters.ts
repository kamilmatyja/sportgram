import React, { useState } from 'react';

export function useListFilters<TFilter>(initialFilter: TFilter, defaultSort = 'createdAt:desc', defaultLimit = 10) {
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(defaultLimit);
    const [sort, setSort] = useState<string>(defaultSort);
    const [filters, setFilters] = useState<TFilter>(initialFilter);

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

    const handlePrevPage = () => setPage(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPage(prev => prev + 1);

    return {
        page, setPage,
        limit, setLimit,
        sort, setSort,
        filters, setFilters,
        handleFilterChange,
        handleSortChange,
        handleLimitChange,
        handlePrevPage,
        handleNextPage
    };
}