import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {GoalParticipantResponse} from '../../api/responses/GoalParticipantResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {SaveStatusEnum} from '../../enums/SaveStatusEnum';
import {formatDate} from '../../utils/dateFormat';

interface GoalDetailsParticipantsTableProps {
    participants: GoalParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateStatus: (participantId: string, status: number) => void;
}

export const GoalDetailsParticipantsTable: React.FC<GoalDetailsParticipantsTableProps> = ({
                                                                                              participants,
                                                                                              relatedUsers,
                                                                                              currentUser,
                                                                                              actionLoading,
                                                                                              onUpdateStatus
                                                                                          }) => {
    const {t} = useTranslation();

    if (participants.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle mb-0">
                    <tbody>
                    <tr>
                        <td colSpan={4} className="text-center text-muted">{t('noParticipants')}</td>
                    </tr>
                    </tbody>
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
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th className="text-end">{t('manage')}</th>
                </tr>
                </thead>
                <tbody>
                {participants.map(p => {
                    const u = relatedUsers[p.userId];
                    const isOwnerOfRecord = currentUser?.id === p.userId;

                    return (
                        <tr key={p.id}>
                            <td>
                                {u ? (
                                    <Link to={`/users/${u.link}`} className="text-decoration-none">
                                        {u.firstName} {u.lastName}
                                    </Link>
                                ) : p.userId}
                            </td>
                            <td>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {SaveStatusEnum.getOptions(t).find(opt => opt.value === p.status)?.label || p.status}
                                </span>
                            </td>
                            <td>{formatDate(p.createdAt)}</td>
                            <td className="text-end">
                                <div className="d-flex justify-content-end gap-1 flex-wrap">
                                    {isOwnerOfRecord && SaveStatusEnum.getOptions(t)
                                        .filter(opt => opt.value !== p.status && opt.value !== SaveStatusEnum.PENDING)
                                        .map(opt => (
                                            <button
                                                key={opt.value}
                                                className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                                disabled={actionLoading === p.id}
                                                onClick={() => onUpdateStatus(p.id, opt.value)}
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