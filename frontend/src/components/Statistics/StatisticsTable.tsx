import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {StatisticResponse} from '../../api/responses/StatisticResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {formatDate} from '../../utils/dateFormat';
import {Link} from 'react-router-dom';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Html';
import {Table, Stack} from 'react-bootstrap';

interface StatisticsTableProps {
    data: StatisticResponse[];
    availableUsers: UserResponse[];
}

export const StatisticsTable: React.FC<StatisticsTableProps> = ({data, availableUsers}) => {
    const {t} = useTranslation();

    const getUserName = (id: string) => {
        const u = availableUsers.find(au => au.id === id);
        return u ? `${u.firstName} ${u.lastName}` : id;
    };

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
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
                            <TableCell colSpan={5} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : data.map((stat, idx) => (
                        <TableRow key={idx}>
                            <TableCell className="fw-bold">
                                <Link to={`/users/${availableUsers.find(au => au.id === stat.userId)?.link || stat.userId}`}
                                      className="btn btn-link p-0 text-decoration-none">
                                    {getUserName(stat.userId)}
                                </Link>
                            </TableCell>
                            <TableCell>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(stat.discipline))?.label || stat.discipline}</TableCell>
                            <TableCell>{stat.distance}</TableCell>
                            <TableCell>{stat.time}</TableCell>
                            <TableCell>{formatDate(stat.createdAt)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Stack>
    );
};