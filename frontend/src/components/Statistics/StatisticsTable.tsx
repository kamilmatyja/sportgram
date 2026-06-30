import React from 'react';
import { Table, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { StatisticResponse } from '../../api/responses/StatisticResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { formatDate } from '../../utils/dateFormat';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

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
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((stat, idx) => {
                            const u = getUser(stat.userId);
                            return (
                                <TableRow key={idx}>
                                    <TableCell>
                                        {u ? (
                                            <Link to={`/users/${u.link}`} className="text-decoration-none">
                                                {u.firstName} {u.lastName}
                                            </Link>
                                        ) : (
                                            stat.userId
                                        )}
                                    </TableCell>
                                    <TableCell className="small">
                                        {DisciplineEnum.getOptions(t).find((opt) => opt.value === stat.discipline)
                                            ?.label || stat.discipline}
                                    </TableCell>
                                    <TableCell>{stat.distance}</TableCell>
                                    <TableCell>{stat.time}</TableCell>
                                    <TableCell className="small text-muted">{formatDate(stat.createdAt)}</TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
