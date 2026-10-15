import React from 'react';
import { Table, Stack } from 'react-bootstrap';

import { StatisticResponse } from '../../api/responses/StatisticResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { formatDate } from '../../utils/dateFormat';
import { getOptionLabel } from '../../utils/options';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';
import { UserLink } from '../Common/UserLink';

interface StatisticsTableProps {
    data: StatisticResponse[];
    availableUsers: UserResponse[];
}

export const StatisticsTable: React.FC<StatisticsTableProps> = ({ data, availableUsers }) => {
    const { t } = useTranslation();

    const getUser = (id: string) => availableUsers.find((au) => au.id === id);

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                        <TableHeaderCell>{t('discipline')}</TableHeaderCell>
                        <TableHeaderCell>{t('distance')} [m]</TableHeaderCell>
                        <TableHeaderCell>{t('timeSeconds')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.length === 0 ? (
                        <EmptyTableRow colSpan={5} />
                    ) : (
                        data.map((stat) => (
                            <TableRow
                                key={`${stat.userId}-${stat.discipline}-${stat.distance}-${stat.createdAt}-${stat.time}`}
                            >
                                <TableCell>
                                    <UserLink user={getUser(stat.userId)} />
                                </TableCell>
                                <TableCell className="small">
                                    {getOptionLabel(DisciplineEnum.getOptions(t), stat.discipline)}
                                </TableCell>
                                <TableCell>{stat.distance}</TableCell>
                                <TableCell>{stat.time}</TableCell>
                                <TableCell className="small text-muted">{formatDate(stat.createdAt)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
