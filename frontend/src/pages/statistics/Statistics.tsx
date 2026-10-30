import { useState, useMemo } from 'react';
import { SegmentedControl, Badge, Text, SimpleGrid, TextInput, Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { statisticService, type StatisticResource, type GetStatisticRecordsQuery } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export default function Statistics() {
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState<'records' | 'progress'>('records');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>(activeTab === 'records' ? 'time:asc' : 'createdAt:desc');

    // Filters
    const [disciplineFilter, setDisciplineFilter] = useState<string | null>(null);
    const [distanceFilter, setDistanceFilter] = useState('');

    const sortOptions: SortOption[] = [
        { value: 'time:asc', label: t('sort_time_asc') },
        { value: 'time:desc', label: t('sort_time_desc') },
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'distance:asc', label: t('sort_distance_asc') },
        { value: 'distance:desc', label: t('sort_distance_desc') },
        { value: 'discipline:asc', label: t('sort_discipline_asc') },
        { value: 'discipline:desc', label: t('sort_discipline_desc') },
    ];

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (disciplineFilter !== null) count++;
        if (distanceFilter.trim()) count++;
        return count;
    }, [disciplineFilter, distanceFilter]);

    const handleResetFilters = () => {
        setDisciplineFilter(null);
        setDistanceFilter('');
        setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            discipline: disciplineFilter ? (Number(disciplineFilter) as DisciplineEnum) : null,
            distance: distanceFilter.trim() ? Number(distanceFilter) : null,
            userIds: currentUser?.id ? [currentUser.id] : null,
        };
    }, [disciplineFilter, distanceFilter, currentUser?.id]);

    const { data, isLoading } = useQuery({
        queryKey: ['statistics', activeTab, currentUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            const query = {
                page,
                limit,
                sort:
                    (sort as NonNullable<GetStatisticRecordsQuery>['sort']) ??
                    (activeTab === 'records' ? 'time:asc' : 'createdAt:desc'),
                filter: queryFilter,
            };
            if (activeTab === 'records') {
                return statisticService.getRecords(query);
            }
            return statisticService.getProgress(query);
        },
        enabled: !!currentUser,
    });

    const stats = data?.data ?? [];
    const pagination = data?.pagination;

    const columns: Column<StatisticResource>[] = [
        {
            key: 'discipline',
            header: t('discipline'),
            render: (s) => (
                <Badge size="xs" variant="light">
                    {DisciplineEnum.getOptions(t).find((o) => o.value === s.discipline)?.label ?? s.discipline}
                </Badge>
            ),
        },
        {
            key: 'distance',
            header: t('distance'),
            render: (s) => (
                <Text size="sm" fw={500}>
                    {s.distance} m
                </Text>
            ),
        },
        {
            key: 'time',
            header: t('time'),
            render: (s) => <Text size="sm">{s.time} s</Text>,
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (s) => (
                <Text size="xs" c="dimmed">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}
                </Text>
            ),
        },
    ];

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
                label={t('discipline')}
                placeholder={t('allDisciplines')}
                data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                value={disciplineFilter}
                onChange={(v) => {
                    setDisciplineFilter(v);
                    setPage(1);
                }}
                clearable
            />
            <TextInput
                label={t('distanceMeters')}
                value={distanceFilter}
                onChange={(e) => {
                    setDistanceFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
        </SimpleGrid>
    );

    return (
        <DataTable
            columns={columns}
            data={stats}
            isLoading={isLoading}
            page={page}
            totalItems={pagination?.total}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
            }}
            sort={sort}
            onSortChange={(s) => {
                setSort(s);
                setPage(1);
            }}
            sortOptions={sortOptions}
            filtersNode={filtersNode}
            hasActiveFilters={activeFiltersCount > 0}
            activeFiltersCount={activeFiltersCount}
            onResetFilters={handleResetFilters}
            toolbarExtra={
                <SegmentedControl
                    value={activeTab}
                    onChange={(val) => {
                        const tab = val as 'records' | 'progress';
                        setActiveTab(tab);
                        setSort(tab === 'records' ? 'time:asc' : 'createdAt:desc');
                        setPage(1);
                    }}
                    data={[
                        { label: t('records'), value: 'records' },
                        { label: t('progress'), value: 'progress' },
                    ]}
                />
            }
        />
    );
}
