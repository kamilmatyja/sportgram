import { useState, useMemo } from 'react';
import { SegmentedControl, Badge, Text, SimpleGrid, TextInput, Select, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { statisticService, type StatisticResource, type GetStatisticRecordsQuery } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { formatDateTime } from '../../utils/date';
import { ViewActionButton } from '../../components/common/RowActionButtons';
import { useDataTableState } from '../../hooks/useDataTableState';
import { useUsersMap } from '../../hooks/useUsersMap';
import { UserInfoCell } from '../../components/common/UserInfoCell';

export default function Statistics() {
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState<'records' | 'progress'>('records');

    const { page, limit, sort, setPage, setSort, onLimitChange, onSortChange, resetPage } = useDataTableState({
        defaultSort: 'time:asc',
    });

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
        resetPage();
    };

    const queryFilter = useMemo(() => {
        return {
            discipline: disciplineFilter ? (Number(disciplineFilter) as DisciplineEnum) : null,
            distance: distanceFilter.trim() ? Number(distanceFilter) : null,
            userIds: null,
        };
    }, [disciplineFilter, distanceFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['statistics', activeTab, page, limit, sort, queryFilter],
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
                return statisticService.getStatisticRecords({ params: { query } });
            }
            return statisticService.getStatisticProgress({ params: { query } });
        },
        enabled: !!currentUser,
    });

    const stats = data?.data ?? [];
    const pagination = data?.pagination;

    const { getUser } = useUsersMap(stats.map((s) => s.userId));

    const columns: Column<StatisticResource>[] = [
        {
            key: 'user',
            header: t('user'),
            render: (s) => <UserInfoCell user={getUser(s.userId)} userId={s.userId} />,
        },
        {
            key: 'discipline',
            header: t('discipline'),
            render: (s) => (
                <Badge variant="light">
                    {DisciplineEnum.getOptions(t).find((o) => o.value === s.discipline)?.label ?? s.discipline}
                </Badge>
            ),
        },
        {
            key: 'distance',
            header: t('distance'),
            render: (s) => <Badge variant="outline">{s.distance} m</Badge>,
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
                <Text size="sm" c="dimmed">
                    {formatDateTime(s.createdAt)}
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
                    resetPage();
                }}
                clearable
            />
            <TextInput
                label={t('distanceMeters')}
                value={distanceFilter}
                onChange={(e) => {
                    setDistanceFilter(e.currentTarget.value);
                    resetPage();
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
            onLimitChange={onLimitChange}
            sort={sort}
            onSortChange={onSortChange}
            sortOptions={sortOptions}
            filtersNode={filtersNode}
            hasActiveFilters={activeFiltersCount > 0}
            activeFiltersCount={activeFiltersCount}
            onResetFilters={handleResetFilters}
            actions={(s) => {
                const u = getUser(s.userId);
                return (
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        {u?.link && <ViewActionButton to={`/users/${u.link}`} />}
                    </Group>
                );
            }}
            toolbarExtra={
                <SegmentedControl
                    value={activeTab}
                    onChange={(val) => {
                        const tab = val as 'records' | 'progress';
                        setActiveTab(tab);
                        setSort(tab === 'records' ? 'time:asc' : 'createdAt:desc');
                        resetPage();
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
