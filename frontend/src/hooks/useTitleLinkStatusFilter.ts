import { useState, useMemo, useCallback } from 'react';

export function useTitleLinkStatusFilter(resetPage?: () => void) {
    const [titleFilter, setTitleFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const activeFiltersCount = [titleFilter.trim(), linkFilter.trim(), statusFilter].filter(Boolean).length;

    const handleResetFilters = useCallback(() => {
        setTitleFilter('');
        setLinkFilter('');
        setStatusFilter(null);
        resetPage?.();
    }, [resetPage]);

    const queryFilter = useMemo(
        () => ({
            title: titleFilter.trim() || null,
            link: linkFilter.trim() || null,
            status: statusFilter ? Number(statusFilter) : null,
        }),
        [titleFilter, linkFilter, statusFilter],
    );

    return {
        titleFilter,
        setTitleFilter,
        linkFilter,
        setLinkFilter,
        statusFilter,
        setStatusFilter,
        activeFiltersCount,
        handleResetFilters,
        queryFilter,
    };
}
