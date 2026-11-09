import { useState, useMemo } from 'react';
import { SegmentedControl, Badge, Text, SimpleGrid, TextInput, Select, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { statisticService, type StatisticResource, type GetStatisticRecordsQuery } from '../../api/services';
import { useAuth } from '../../auth';
import { DataTable, type Column } from '../../components';
import { ViewActionButton, UserInfoCell } from '../../components';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { useDataTableState, useUsersMap } from '../../hooks';
import {
    formatDateTime,
    buildSortOptions,
    formatDistance,
    formatTime,
    formatPace,
    formatSpeed,
    calculatePace,
    calculateSpeed,
} from '../../utils';

export default function Statistics() {
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState<'records' | 'progress'>('records');
    const tableState = useDataTableState({ defaultSort: 'time:asc' });

    const [disciplineFilter, setDisciplineFilter] = useState<string | null>(null);
    const [distanceFilter, setDistanceFilter] = useState('');

    const sortOptions = buildSortOptions(t, ['time', 'createdAt', 'distance', 'discipline']);
    const activeFiltersCount = [disciplineFilter, distanceFilter.trim()].filter(Boolean).length;

    const handleResetFilters = () => {
        setDisciplineFilter(null);
        setDistanceFilter('');
        tableState.resetPage();
    };

    const queryFilter = useMemo(
        () => ({
            discipline: disciplineFilter ? (Number(disciplineFilter) as DisciplineEnum) : null,
            distance: distanceFilter.trim() ? Number(distanceFilter) : null,
            userIds: null,
        }),
        [disciplineFilter, distanceFilter],
    );

    const { data, isLoading } = useQuery({
        queryKey: ['statistics', activeTab, tableState.page, tableState.limit, tableState.sort, queryFilter],
        queryFn: () => {
            const query = {
                page: tableState.page,
                limit: tableState.limit,
                sort:
                    (tableState.sort as NonNullable<GetStatisticRecordsQuery>['sort']) ??
                    (activeTab === 'records' ? 'time:asc' : 'createdAt:desc'),
                filter: queryFilter,
            };
            return activeTab === 'records'
                ? statisticService.getStatisticRecords({ params: { query } })
                : statisticService.getStatisticProgress({ params: { query } });
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
                <Badge>
                    {DisciplineEnum.getOptions(t).find((o) => o.value === s.discipline)?.label ?? s.discipline}
                </Badge>
            ),
        },
        {
            key: 'distance',
            header: t('distance'),
            render: (s) => <Badge variant="outline">{formatDistance(s.distance)}</Badge>,
        },
        {
            key: 'time',
            header: t('time'),
            render: (s) => <Text size="sm">{formatTime(s.time)}</Text>,
        },
        {
            key: 'pace',
            header: t('pace'),
            render: (s) => <Text size="sm">{formatPace(calculatePace(s.distance, s.time))}</Text>,
        },
        {
            key: 'speed',
            header: t('speed'),
            render: (s) => <Text size="sm">{formatSpeed(calculateSpeed(s.distance, s.time))}</Text>,
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
        <SimpleGrid>
            <Select
                label={t('discipline')}
                placeholder={t('allDisciplines')}
                data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                value={disciplineFilter}
                onChange={(v) => {
                    setDisciplineFilter(v);
                    tableState.resetPage();
                }}
                clearable
            />
            <TextInput
                label={t('distanceMeters')}
                value={distanceFilter}
                onChange={(e) => {
                    setDistanceFilter(e.currentTarget.value);
                    tableState.resetPage();
                }}
            />
        </SimpleGrid>
    );

    return (
        <DataTable
            columns={columns}
            data={stats}
            isLoading={isLoading}
            totalItems={pagination?.total}
            state={tableState}
            sortOptions={sortOptions}
            filtersNode={filtersNode}
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
                        tableState.setSort(tab === 'records' ? 'time:asc' : 'createdAt:desc');
                        tableState.resetPage();
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
