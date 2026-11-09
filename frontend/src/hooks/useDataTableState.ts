import { useState, useCallback } from 'react';

export interface UseDataTableStateOptions {
    initialPage?: number;
    initialLimit?: number;
    initialSort?: string | null;
    defaultSort?: string | null;
}

export function useDataTableState(options: UseDataTableStateOptions = {}) {
    const { initialPage = 1, initialLimit = 10 } = options;
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    const [sort, setSort] = useState<string | null>(options.initialSort ?? options.defaultSort ?? 'createdAt:desc');

    const onLimitChange = useCallback((newLimit: number) => {
        setLimit(newLimit);
        setPage(1);
    }, []);

    const onSortChange = useCallback((newSort: string | null) => {
        setSort(newSort);
        setPage(1);
    }, []);

    const resetPage = useCallback(() => setPage(1), []);

    return { page, setPage, limit, setLimit, sort, setSort, onLimitChange, onSortChange, resetPage };
}
