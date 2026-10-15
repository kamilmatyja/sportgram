import React, { useEffect, useRef, useState } from 'react';

import { CollectionResponse } from '../../api/responses/CollectionResponse';
import { PaginationResponse } from '../../api/responses/PaginationResponse';

interface IndexQuery {
    page?: number;
    limit?: number;
    sort?: string;
    filter?: unknown;
}

const FILTER_DEBOUNCE_MS = 300;
const IMMEDIATE_INPUT_TYPES = [
    'checkbox',
    'radio',
    'date',
    'datetime-local',
    'month',
    'week',
    'time',
    'color',
    'range',
];

export function useListFilters<TFilter>(initialFilter: TFilter, defaultSort = 'createdAt:desc', defaultLimit = 10) {
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(defaultLimit);
    const [sort, setSort] = useState<string>(defaultSort);
    const [filters, setFilters] = useState<TFilter>(initialFilter);
    const [appliedFilters, setAppliedFilters] = useState<TFilter>(initialFilter);
    const [pagination, setPagination] = useState<PaginationResponse | null>(null);
    const debounceNextFilters = useRef<boolean>(false);
    const resetPageOnApply = useRef<boolean>(false);

    useEffect(() => {
        const applyFilters = () => {
            setAppliedFilters(filters);
            if (resetPageOnApply.current) {
                resetPageOnApply.current = false;
                setPage(1);
            }
        };
        const debounce = debounceNextFilters.current;
        debounceNextFilters.current = false;
        if (!debounce) {
            applyFilters();
            return;
        }
        const timer = setTimeout(applyFilters, FILTER_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        debounceNextFilters.current = !(e.target instanceof HTMLSelectElement) && !IMMEDIATE_INPUT_TYPES.includes(type);
        resetPageOnApply.current = true;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
    };

    const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLimit(Number(e.target.value));
        setPage(1);
    };

    const handlePrevPage = () => setPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setPage((prev) => prev + 1);

    const buildIndexQuery = <Q extends IndexQuery>(query: Q, filter: Q['filter']): Q => {
        query.page = page;
        query.limit = limit;
        query.sort = sort;
        query.filter = filter;
        return query;
    };

    const applyPagination = <T>(response: CollectionResponse<T>): T[] => {
        setPagination(response.pagination);
        return response.data;
    };

    return {
        page,
        setPage,
        limit,
        setLimit,
        sort,
        setSort,
        filters,
        appliedFilters,
        setFilters,
        handleFilterChange,
        handleSortChange,
        handleLimitChange,
        handlePrevPage,
        handleNextPage,
        hasMore: pagination?.hasNextPage ?? false,
        buildIndexQuery,
        applyPagination,
    };
}
