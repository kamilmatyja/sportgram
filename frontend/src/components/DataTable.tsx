import React from 'react';
import { Table, Pagination, Group, TextInput, Button, Select, Paper, Text, Skeleton, Stack, Flex } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
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
    onAdd?: () => void;
    addLabel?: string;
    actions?: (item: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
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
    onAdd,
    addLabel,
    actions,
}: DataTableProps<T>) {
    const { t } = useTranslation();

    const computedTotalPages = totalPages ?? (totalItems && limit ? Math.max(1, Math.ceil(totalItems / limit)) : 1);

    return (
        <Paper withBorder radius="md" p="md" shadow="xs">
            <Stack gap="md">
                {/* Header toolbar */}
                {(onSearchChange || onAdd) && (
                    <Flex justify="space-between" align="center" wrap="wrap" gap="sm">
                        {onSearchChange ? (
                            <TextInput
                                placeholder={searchPlaceholder ?? t('search')}
                                leftSection={<IconSearch size={16} />}
                                value={search ?? ''}
                                onChange={(e) => onSearchChange(e.currentTarget.value)}
                                flex={1}
                                maw={350}
                            />
                        ) : (
                            <div />
                        )}

                        {onAdd && (
                            <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
                                {addLabel ?? t('add')}
                            </Button>
                        )}
                    </Flex>
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
                                data.map((row, index) => (
                                    <Table.Tr key={row.id ?? index}>
                                        {columns.map((col) => (
                                            <Table.Td key={col.key}>
                                                {col.render ? col.render(row) : (row[col.key] ?? '-')}
                                            </Table.Td>
                                        ))}
                                        {actions && <Table.Td ta="right">{actions(row)}</Table.Td>}
                                    </Table.Tr>
                                ))
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
