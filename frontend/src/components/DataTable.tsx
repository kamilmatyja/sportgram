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

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
}

export interface SortOption {
    value: string;
    label: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
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
}

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    isLoading,
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
}: DataTableProps<T>) {
    const { t } = useTranslation();
    const [filtersOpened, setFiltersOpened] = useState(false);

    const computedTotalPages = totalPages ?? (totalItems && limit ? Math.max(1, Math.ceil(totalItems / limit)) : 1);

    const hasToolbar = onSearchChange || sortOptions || filtersNode || onAdd || toolbarExtra;

    return (
        <Paper withBorder radius="md" p="md" shadow="xs">
            <Stack gap="md">
                {/* Header toolbar */}
                {hasToolbar && (
                    <Flex justify="space-between" align="center" wrap="wrap" gap="sm">
                        <Group gap="sm" flex={1} wrap="wrap">
                            {onSearchChange && (
                                <TextInput
                                    placeholder={searchPlaceholder ?? t('search')}
                                    leftSection={<IconSearch size={16} />}
                                    value={search ?? ''}
                                    onChange={(e) => onSearchChange(e.currentTarget.value)}
                                    flex={1}
                                    maw={300}
                                />
                            )}

                            {sortOptions && onSortChange && (
                                <Select
                                    placeholder={t('sortBy')}
                                    data={sortOptions}
                                    value={sort ?? null}
                                    onChange={onSortChange}
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
                                    >
                                        {t('filters')}
                                        {activeFiltersCount && activeFiltersCount > 0 ? (
                                            <Badge size="xs" circle ml={6}>
                                                {activeFiltersCount}
                                            </Badge>
                                        ) : null}
                                    </Button>

                                    {hasActiveFilters && onResetFilters && (
                                        <Button
                                            variant="subtle"
                                            color="gray"
                                            size="sm"
                                            leftSection={<IconX size={16} />}
                                            onClick={onResetFilters}
                                        >
                                            {t('clearFilters')}
                                        </Button>
                                    )}
                                </Group>
                            )}

                            {toolbarExtra}
                        </Group>

                        {onAdd && (
                            <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
                                {addLabel ?? t('add')}
                            </Button>
                        )}
                    </Flex>
                )}

                {/* Collapsible Filter Panel */}
                {filtersNode && (
                    <Collapse expanded={filtersOpened}>
                        <Paper withBorder p="md" radius="md">
                            <Stack gap="sm">{filtersNode}</Stack>
                        </Paper>
                    </Collapse>
                )}

                {/* Table */}
                <Table.ScrollContainer minWidth={600}>
                    <Table striped highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                {columns.map((col) => (
                                    <Table.Th key={col.key}>{col.header}</Table.Th>
                                ))}
                                {actions && (
                                    <Table.Th w={120} ta="right">
                                        {t('manage')}
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
                                                <Skeleton height={20} radius="sm" />
                                            </Table.Td>
                                        ))}
                                        {actions && (
                                            <Table.Td>
                                                <Skeleton height={20} radius="sm" />
                                            </Table.Td>
                                        )}
                                    </Table.Tr>
                                ))
                            ) : data.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={columns.length + (actions ? 1 : 0)} ta="center" p={32}>
                                        <Text c="dimmed">{t('noRecords')}</Text>
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

                {/* Footer pagination */}
                {onPageChange && (
                    <Flex justify="space-between" align="center" wrap="wrap" gap="sm">
                        <Group gap="xs">
                            {onLimitChange && (
                                <Select
                                    value={String(limit)}
                                    onChange={(v) => v && onLimitChange(Number(v))}
                                    data={['5', '10', '20', '50']}
                                    size="xs"
                                    w={75}
                                />
                            )}
                            {totalItems !== undefined && (
                                <Text size="xs" c="dimmed">
                                    {t('total')}: {totalItems}
                                </Text>
                            )}
                        </Group>

                        <Pagination
                            value={page}
                            onChange={onPageChange}
                            total={computedTotalPages}
                            size="sm"
                            withEdges
                        />
                    </Flex>
                )}
            </Stack>
        </Paper>
    );
}
