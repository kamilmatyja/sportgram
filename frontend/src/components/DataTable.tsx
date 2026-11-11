import React, { useState } from 'react';
import {
    Table,
    Pagination,
    Group,
    TextInput,
    Button,
    Select,
    Paper,
    Text,
    Skeleton,
    Stack,
    Flex,
    Collapse,
    Badge,
} from '@mantine/core';
import { IconSearch, IconPlus, IconFilter, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../services';
import { getDefaultSortOptions, buildSortOptions, type SortOption } from '../utils';
import { EmptyState } from './EmptyState';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
}

export { buildSortOptions };
export type { SortOption };

export interface DataTableStateLike {
    page: number;
    limit: number;
    sort?: string | null;
    setPage: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onSortChange: (sort: string | null) => void;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    state?: DataTableStateLike;
    page?: number;
    totalPages?: number;
    totalItems?: number;
    onPageChange?: (page: number) => void;
    limit?: number;
    onLimitChange?: (limit: number) => void;
    search?: string;
    onSearchChange?: (val: string) => void;
    searchPlaceholder?: string;
    sort?: string | null;
    onSortChange?: (val: string | null) => void;
    sortOptions?: SortOption[];
    filtersNode?: React.ReactNode;
    hasActiveFilters?: boolean;
    activeFiltersCount?: number;
    onResetFilters?: () => void;
    onAdd?: () => void;
    addLabel?: string;
    actions?: (item: T) => React.ReactNode;
    toolbarExtra?: React.ReactNode;
    minWidth?: number | string;
}

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    isLoading,
    state,
    page = 1,
    totalPages,
    totalItems,
    onPageChange,
    limit = 10,
    onLimitChange,
    search,
    onSearchChange,
    searchPlaceholder,
    sort,
    onSortChange,
    sortOptions,
    filtersNode,
    hasActiveFilters,
    activeFiltersCount,
    onResetFilters,
    onAdd,
    addLabel,
    actions,
    toolbarExtra,
    minWidth = 500,
}: DataTableProps<T>) {
    const { t } = useTranslation();
    const { isOfflineDisabled } = useOffline();
    const [filtersOpened, setFiltersOpened] = useState(false);

    const activePage = state?.page ?? page;
    const activeLimit = state?.limit ?? limit;
    const activeSort = state?.sort ?? sort;
    const activeOnPageChange = state?.setPage ?? onPageChange;
    const activeOnLimitChange = state?.onLimitChange ?? onLimitChange;
    const activeOnSortChange = state?.onSortChange ?? onSortChange;
    const isFiltersActive = hasActiveFilters ?? (activeFiltersCount ?? 0) > 0;

    const computedTotalPages =
        totalPages ?? (totalItems && activeLimit ? Math.max(1, Math.ceil(totalItems / activeLimit)) : 1);

    const effectiveSortOptions = sortOptions ?? (activeOnSortChange ? getDefaultSortOptions(t) : undefined);
    const hasToolbar = onSearchChange || effectiveSortOptions || filtersNode || onAdd || toolbarExtra;

    return (
        <Paper>
            <Stack>
                {hasToolbar && (
                    <Flex justify="space-between" align="center" wrap="wrap" gap="sm">
                        <Group flex={1} wrap="wrap">
                            {onSearchChange && (
                                <TextInput
                                    placeholder={searchPlaceholder ?? t('search')}
                                    aria-label={searchPlaceholder ?? t('search')}
                                    leftSection={<IconSearch size={16} />}
                                    value={search ?? ''}
                                    onChange={(e) => onSearchChange(e.currentTarget.value)}
                                    disabled={isOfflineDisabled}
                                    flex={1}
                                    maw={300}
                                />
                            )}

                            {effectiveSortOptions && activeOnSortChange && (
                                <Select
                                    placeholder={t('sortBy')}
                                    aria-label={t('sortBy')}
                                    data={effectiveSortOptions}
                                    value={activeSort ?? null}
                                    onChange={activeOnSortChange}
                                    disabled={isOfflineDisabled}
                                    clearable
                                    searchable
                                    maw={260}
                                    flex={1}
                                />
                            )}

                            {filtersNode && (
                                <Group gap="xs">
                                    <Button
                                        variant={filtersOpened ? 'filled' : 'light'}
                                        leftSection={<IconFilter size={16} />}
                                        onClick={() => setFiltersOpened((prev) => !prev)}
                                        disabled={isOfflineDisabled}
                                    >
                                        {t('filters')}
                                        {activeFiltersCount && activeFiltersCount > 0 ? (
                                            <Badge size="xs" circle ml={6}>
                                                {activeFiltersCount}
                                            </Badge>
                                        ) : null}
                                    </Button>

                                    {isFiltersActive && onResetFilters && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            leftSection={<IconX size={16} />}
                                            onClick={onResetFilters}
                                            disabled={isOfflineDisabled}
                                        >
                                            {t('clearFilters')}
                                        </Button>
                                    )}
                                </Group>
                            )}

                            {toolbarExtra}
                        </Group>

                        {onAdd && (
                            <Button leftSection={<IconPlus size={16} />} onClick={onAdd} disabled={isOfflineDisabled}>
                                {addLabel ?? t('add')}
                            </Button>
                        )}
                    </Flex>
                )}

                {filtersNode && (
                    <Collapse expanded={filtersOpened}>
                        <Paper>
                            <Stack gap="sm">{filtersNode}</Stack>
                        </Paper>
                    </Collapse>
                )}

                <Table.ScrollContainer minWidth={minWidth}>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                {columns.map((col) => (
                                    <Table.Th key={col.key}>{col.header}</Table.Th>
                                ))}
                                {actions && (
                                    <Table.Th w={120} ta="right">
                                        {t('actions')}
                                    </Table.Th>
                                )}
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <Table.Tr key={i}>
                                        {columns.map((c) => (
                                            <Table.Td key={c.key}>
                                                <Skeleton height={20} />
                                            </Table.Td>
                                        ))}
                                        {actions && (
                                            <Table.Td>
                                                <Skeleton height={20} />
                                            </Table.Td>
                                        )}
                                    </Table.Tr>
                                ))
                            ) : data.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td
                                        colSpan={columns.length + (actions ? 1 : 0)}
                                        p={0}
                                        m={0}
                                        style={{ padding: 0, margin: 0 }}
                                    >
                                        <EmptyState title={t('noData')} />
                                    </Table.Td>
                                </Table.Tr>
                            ) : (
                                data.map((row, index) => {
                                    const rowRecord = row as Record<string, unknown>;
                                    return (
                                        <Table.Tr key={(rowRecord.id as string) ?? index}>
                                            {columns.map((col) => (
                                                <Table.Td key={col.key}>
                                                    {col.render
                                                        ? col.render(row)
                                                        : ((rowRecord[col.key] as React.ReactNode) ?? '-')}
                                                </Table.Td>
                                            ))}
                                            {actions && <Table.Td ta="right">{actions(row)}</Table.Td>}
                                        </Table.Tr>
                                    );
                                })
                            )}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>

                {activeOnPageChange && (
                    <Flex justify="space-between" align="center" wrap="wrap" gap="sm">
                        <Group gap="xs">
                            {activeOnLimitChange && (
                                <Select
                                    aria-label={t('perPage')}
                                    value={String(activeLimit)}
                                    onChange={(v) => v && activeOnLimitChange(Number(v))}
                                    data={['5', '10', '20', '50']}
                                    size="xs"
                                    w={75}
                                    disabled={isOfflineDisabled}
                                />
                            )}
                            {totalItems !== undefined && (
                                <Text size="sm" c="dimmed">
                                    {t('total')}: {totalItems}
                                </Text>
                            )}
                        </Group>

                        <Pagination
                            value={activePage}
                            onChange={activeOnPageChange}
                            total={computedTotalPages}
                            size="sm"
                            withEdges
                            disabled={isOfflineDisabled}
                        />
                    </Flex>
                )}
            </Stack>
        </Paper>
    );
}
