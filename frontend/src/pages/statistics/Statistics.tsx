import { useState, useMemo } from 'react';
import {
    SegmentedControl,
    Badge,
    Text,
    SimpleGrid,
    TextInput,
    Select,
    Group,
    Avatar,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    statisticService,
    userService,
    type StatisticResource,
    type GetStatisticRecordsQuery,
    type UserResource,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { formatDateTime } from '../../utils/date';
import { formatImageSrc } from '../../utils/imageUtils';

export default function Statistics() {
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState<'records' | 'progress'>('records');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>(activeTab === 'records' ? 'time:asc' : 'createdAt:desc');

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
                return statisticService.getRecords(query);
            }
            return statisticService.getProgress(query);
        },
        enabled: !!currentUser,
    });

    const stats = data?.data ?? [];
    const pagination = data?.pagination;

    const userIds = useMemo(() => {
        const ids = stats.map((s) => s.userId).filter(Boolean);
        return Array.from(new Set(ids));
    }, [stats]);

    const { data: usersMapData } = useQuery({
        queryKey: ['stats-users', userIds],
        queryFn: async () => {
            if (userIds.length === 0) return {};
            const users = await userService.getUsersByIds(userIds);
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: userIds.length > 0,
    });

    const usersMap = usersMapData ?? {};

    const columns: Column<StatisticResource>[] = [
        {
            key: 'user',
            header: t('user'),
            render: (s) => {
                const u = usersMap[s.userId];
                return (
                    <Group gap="sm">
                        <Avatar src={formatImageSrc(u?.profilePhoto)} radius={5}>
                            ?
                        </Avatar>
                        <div>
                            <Text size="sm" fw={600}>
                                {u ? `${u.firstName} ${u.lastName}` : s.userId}
                            </Text>
                            {u?.link && (
                                <Text size="sm" c="dimmed">
                                    @{u.link}
                                </Text>
                            )}
                        </div>
                    </Group>
                );
            },
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
            actions={(s) => {
                const u = usersMap[s.userId];
                return (
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        {u?.link && (
                            <Tooltip label={t('details')} withArrow>
                                <ActionIcon
                                    component={Link}
                                    to={`/users/${u.link}`}
                                    variant="light"
                                    size={30}
                                    aria-label={t('details')}
                                >
                                    <IconEye size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
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
