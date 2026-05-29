import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {GoalStatusEnum} from '../../enums/GoalStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {GoalParticipantsTable} from './GoalParticipantsTable';

interface UserGoalsTableProps {
    goals: GoalResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (goal: GoalResponse) => void;
    interactions: any;
}

export const UserGoalsTable: React.FC<UserGoalsTableProps> = ({
                                                                  goals,
                                                                  relatedUsers,
                                                                  currentUser,
                                                                  isMyProfile,
                                                                  isAdmin,
                                                                  actionLoading,
                                                                  onManageClick,
                                                                  interactions
                                                              }) => {
    const {t} = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('title')}</th>
                    <th>{t('discipline')}</th>
                    <th>{t('distance')} [m]</th>
                    <th>{t('time')} [s]</th>
                    <th>{t('status')}</th>
                    <th>{t('startedAt')}</th>
                    <th>{t('endedAt')}</th>
                    <th>{t('details')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {goals.length === 0 ? (
                    <tr>
                        <td colSpan={9} className="text-center text-muted">{t('noRecords')}</td>
                    </tr>
                ) : goals.map(goal => (
                    <React.Fragment key={goal.id}>
                        <tr>
                            <td>
                                <a href={`/goals/${goal.link}`} className="btn btn-link p-0 text-decoration-none">
                                    {goal.text}
                                </a>
                            </td>
                            <td>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(goal.discipline))?.label || goal.discipline}</td>
                            <td>{goal.distance}</td>
                            <td>{goal.time ? goal.time : '-'}</td>
                            <td>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {GoalStatusEnum.getOptions(t).find(opt => String(opt.value) === String(goal.status))?.label || goal.status}
                                </span>
                            </td>
                            <td>{formatDate(goal.startedAt)}</td>
                            <td>{formatDate(goal.endedAt)}</td>
                            <td>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleRow(goal.id)}>
                                    {expandedRow === goal.id ? <i className="bi bi-chevron-up"></i> :
                                        <i className="bi bi-chevron-down"></i>} {t('participants')}
                                </button>
                            </td>
                            <td className="text-end">
                                <div className="d-flex justify-content-end gap-2 flex-wrap">
                                    {(isMyProfile || isAdmin) && (
                                        <button className="btn btn-sm btn-profile-outline-primary" title={t('manage')}
                                                onClick={() => onManageClick(goal)}>
                                            <i className="bi bi-gear" aria-hidden="true"></i>
                                            <span className="visually-hidden">{t('manage')}</span>
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                        {expandedRow === goal.id && (
                            <tr className="bg-light">
                                <td colSpan={8} className="p-3">
                                    <div className="border rounded border-profile-primary bg-white p-3">
                                        <h6 className="mb-3 text-profile-primary">{t('participants')} ({goal.participants?.length || 0})</h6>
                                        <GoalParticipantsTable
                                            participants={goal.participants || []}
                                            relatedUsers={relatedUsers}
                                            currentUser={currentUser}
                                            actionLoading={actionLoading}
                                            onUpdateParticipantStatus={interactions.handleParticipantStatusSubmit}
                                            onUpdateResultStatus={interactions.handleResultStatusSubmit}
                                        />
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
};