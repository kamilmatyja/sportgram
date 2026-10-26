import { useState } from 'react';
import { Paper, Title, SegmentedControl, Stack, Badge, Text, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { statisticService, type StatisticResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export default function Statistics() {
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState<'records' | 'progress'>('records');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data, isLoading } = useQuery({
        queryKey: ['statistics', activeTab, currentUser?.id, page, limit],
        queryFn: () => {
            if (activeTab === 'records') {
                return statisticService.getRecords({ page, limit, sort: 'time:asc' });
            }
            return statisticService.getProgress({ page, limit, sort: 'createdAt:desc' });
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
                <Badge size="xs" color="blue" variant="light">
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

    return (
        <Stack gap="md" className="max-w-800">
            <Paper withBorder p="md" radius="md">
                <Stack gap="md">
                    <Group justify="space-between" align="center" wrap="wrap">
                        <Title order={3}>{t('statistics')}</Title>
                        <SegmentedControl
                            value={activeTab}
                            onChange={(val) => {
                                setActiveTab(val as 'records' | 'progress');
                                setPage(1);
                            }}
                            data={[
                                { label: t('records'), value: 'records' },
                                { label: t('progress'), value: 'progress' },
                            ]}
                        />
                    </Group>

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
                    />
                </Stack>
            </Paper>
        </Stack>
    );
}
