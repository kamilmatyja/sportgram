import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import { GoalParticipantResponse } from '../../api/responses/GoalParticipantResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { formatDate } from '../../utils/dateFormat';

interface GoalDetailsResultsTableProps {
    participants: GoalParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateStatus: (resultId: string, status: number) => void;
}

export const GoalDetailsResultsTable: React.FC<GoalDetailsResultsTableProps> = ({
                                                                                    participants, relatedUsers, currentUser, actionLoading, onUpdateStatus
                                                                                }) => {
    const { t } = useTranslation();

    const allResults = participants.flatMap(p => p.results.map(r => ({
        ...r,
        userId: p.userId
    })));

    if (allResults.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle mb-0">
                    <tbody><tr><td colSpan={6} className="text-center text-muted">{t('noRecords')}</td></tr></tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('user')}</th>
                    <th>{t('distance')} [m]</th>
                    <th>{t('timeSeconds')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th className="text-end">{t('manage')}</th>
                </tr>
                </thead>
                <tbody>
                {allResults.map(r => {
                    const u = relatedUsers[r.userId];
                    const isOwnerOfRecord = currentUser?.id === r.userId;

                    return (
                        <tr key={r.id}>
                            <td>
                                {u ? (
                                    <Link to={`/users/${u.link}`} className="text-decoration-none">
                                        {u.firstName} {u.lastName}
                                    </Link>
                                ) : r.userId}
                            </td>
                            <td>{r.distance}</td>
                            <td>{r.time}</td>
                            <td>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {SaveStatusEnum.getOptions(t).find(opt => opt.value === r.status)?.label || r.status}
                                </span>
                            </td>
                            <td>{formatDate(r.createdAt)}</td>
                            <td className="text-end">
                                <div className="d-flex justify-content-end gap-1 flex-wrap">
                                    {isOwnerOfRecord && SaveStatusEnum.getOptions(t)
                                        .filter(opt => opt.value !== r.status && opt.value !== SaveStatusEnum.PENDING)
                                        .map(opt => (
                                            <button
                                                key={opt.value}
                                                className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                                disabled={actionLoading === r.id}
                                                onClick={() => onUpdateStatus(r.id, opt.value)}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};