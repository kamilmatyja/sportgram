import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { StatisticResponse } from '../../api/responses/StatisticResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { formatDate } from '../../utils/dateFormat';
import { Link } from 'react-router-dom';

interface StatisticsTableProps {
    data: StatisticResponse[];
    availableUsers: UserResponse[];
    activeTab: 'records' | 'progress';
}

export const StatisticsTable: React.FC<StatisticsTableProps> = ({ data, availableUsers, activeTab }) => {
    const { t } = useTranslation();

    const getUserName = (id: string) => {
        const u = availableUsers.find(au => au.id === id);
        return u ? `${u.firstName} ${u.lastName}` : id;
    };

    if (data.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle">
                    <tbody>
                    <tr>
                        <td colSpan={5} className="text-center text-muted">
                            {activeTab === 'records' ? t('noRecords') : t('noProgress')}
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                <tr>
                    <th>{t('user')}</th>
                    <th>{t('discipline')}</th>
                    <th>{t('distance')} [m]</th>
                    <th>{t('timeSeconds')}</th>
                    <th>{t('createdAt')}</th>
                </tr>
                </thead>
                <tbody>
                {data.map((stat, idx) => (
                    <tr key={idx}>
                        <td className="fw-bold">
                            <Link to={`/users/${availableUsers.find(au => au.id === stat.userId)?.link || stat.userId}`} className="btn btn-link p-0 text-decoration-none">
                                {getUserName(stat.userId)}
                            </Link>
                        </td>
                        <td>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(stat.discipline))?.label || stat.discipline}</td>
                        <td>{stat.distance}</td>
                        <td>{stat.time}</td>
                        <td>{formatDate(stat.createdAt)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};