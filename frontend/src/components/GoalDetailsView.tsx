import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {GoalResponse} from '../api/responses/GoalResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {ColorEnum} from '../enums/ColorEnum';
import {GoalStatusEnum} from '../enums/GoalStatusEnum';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {formatDate} from '../utils/dateFormat';

interface GoalDetailsViewProps {
    goal: GoalResponse | null;
    ownerUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    isParticipantOfGoal: boolean;
    loading: boolean;
    error: string | null;
    onManageClick: (goal: GoalResponse) => void;
}

export const GoalDetailsView: React.FC<GoalDetailsViewProps> = ({
                                                                    goal,
                                                                    ownerUser,
                                                                    relatedUsers,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    isParticipantOfGoal,
                                                                    loading,
                                                                    error,
                                                                    onManageClick
                                                                }) => {
    const {t} = useTranslation();

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border"/>
    </div>;

    if (error || !goal || !ownerUser) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const themeClass = ColorEnum.getClass(ownerUser.color);
    const canManage = isMyProfile || isAdmin || isParticipantOfGoal;

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`} tabIndex={-1}>
            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                <a href={`/users/${ownerUser.link}/goals`} className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('goals')}
                </a>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0">{t('goalDetails')}</h4>
                        {canManage && (
                            <button className="btn btn-profile-primary" onClick={() => onManageClick(goal)}>
                                <i className="bi bi-gear me-1"></i> {t('manage')}
                            </button>
                        )}
                    </div>

                    <div className="mb-4 border-bottom pb-4">
                        <h5>{goal.text}</h5>
                        <p className="text-muted mb-2">
                            {DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(goal.discipline))?.label || goal.discipline}
                            <span className="mx-2">|</span>
                            {goal.distance} [m]
                            {goal.time ? <><span className="mx-2">|</span> {goal.time} [s]</> : ''}
                        </p>
                        {(goal.startedAt || goal.endedAt) && (
                            <p className="text-muted mb-2">
                                {goal.startedAt && <>
                                    <span>{t('from')}: {formatDate(goal.startedAt)}</span>
                                </>}
                                {goal.endedAt && <>
                                    <span className="mx-2">{t('to')}:</span> <span>{formatDate(goal.endedAt)}</span>
                                </>}
                            </p>
                        )}
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <strong>{t('goalStatus')}: </strong>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {GoalStatusEnum.getOptions(t).find(opt => String(opt.value) === String(goal.status))?.label || goal.status}
                            </span>
                        </div>
                    </div>

                    <div className="mb-4 border-bottom pb-4">
                        <h5 className="mb-3">{t('participants')}</h5>
                        <div className="table-responsive-custom">
                            <table className="table table-bordered table-hover align-middle mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th>{t('user')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('createdAt')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {goal.participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center text-muted">{t('noParticipants')}</td>
                                    </tr>
                                ) : goal.participants.map(p => {
                                    const u = relatedUsers[p.userId];
                                    return (
                                        <tr key={p.id}>
                                            <td>
                                                {u ? <a href={`/users/${u.link}`}
                                                        className="btn btn-link p-0 text-decoration-none">{u.firstName} {u.lastName}</a> : p.userId}
                                            </td>
                                            <td>{SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(p.status))?.label || p.status}</td>
                                            <td>{formatDate(p.createdAt)}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mb-0">
                        <h5 className="mb-3">{t('results')}</h5>
                        <div className="table-responsive-custom">
                            <table className="table table-bordered table-hover align-middle mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th>{t('user')}</th>
                                    <th>{t('distance')} [m]</th>
                                    <th>{t('timeSeconds')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('createdAt')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {(() => {
                                    const allResults = goal.participants.flatMap(p => p.results.map(r => ({
                                        ...r,
                                        userId: p.userId
                                    })));
                                    if (allResults.length === 0) {
                                        return <tr>
                                            <td colSpan={5} className="text-center text-muted">{t('noRecords')}</td>
                                        </tr>;
                                    }
                                    return allResults.map(r => {
                                        const u = relatedUsers[r.userId];
                                        return (
                                            <tr key={r.id}>
                                                <td>
                                                    {u ? <a href={`/users/${u.link}`}
                                                            className="btn btn-link p-0 text-decoration-none">{u.firstName} {u.lastName}</a> : r.userId}
                                                </td>
                                                <td>{r.distance}</td>
                                                <td>{r.time}</td>
                                                <td>{SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(r.status))?.label || r.status}</td>
                                                <td>{formatDate(r.createdAt)}</td>
                                            </tr>
                                        );
                                    });
                                })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};