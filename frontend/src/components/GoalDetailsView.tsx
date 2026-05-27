import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { GoalResponse } from '../api/responses/GoalResponse';
import { UserResponse } from '../api/responses/UserResponse';
import { ColorEnum } from '../enums/ColorEnum';
import { GoalStatusEnum } from '../enums/GoalStatusEnum';
import { DisciplineEnum } from '../enums/DisciplineEnum';
import { formatDate } from '../utils/dateFormat';
import { UserSubpageHeader } from './User/UserSubpageHeader';
import { GoalDetailsParticipantsTable } from './Goal/GoalDetailsParticipantsTable';
import { GoalDetailsResultsTable } from './Goal/GoalDetailsResultsTable';

interface GoalDetailsViewProps {
    goal: GoalResponse | null;
    ownerUser: UserResponse | null;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    onManageClick: (goal: GoalResponse) => void;
    interactions: any;
}

export const GoalDetailsView: React.FC<GoalDetailsViewProps> = ({
                                                                    goal, ownerUser, currentUser, relatedUsers, isMyProfile, isAdmin, loading, error, onManageClick, interactions
                                                                }) => {
    const { t } = useTranslation();

    if (loading) return <div className="container mt-5 text-center"><div className="spinner-border text-profile-primary" /></div>;
    if (error || !goal || !ownerUser) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const themeClass = ColorEnum.getClass(ownerUser.color);
    const canManage = isMyProfile || isAdmin;

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={ownerUser} title={t('goalDetails')} />

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 text-profile-primary fw-bold">{t('goalDetails')}</h4>
                        {canManage && (
                            <button className="btn btn-profile-primary" onClick={() => onManageClick(goal)}>
                                <i className="bi bi-gear me-1"></i> {t('manage')}
                            </button>
                        )}
                    </div>

                    <div className="mb-2">
                        <h5>{goal.text}</h5>
                        <p className="text-muted mb-2">
                            {DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(goal.discipline))?.label || goal.discipline}
                            <span className="mx-2">|</span>
                            {goal.distance} [m]
                            {goal.time ? <><span className="mx-2">|</span> {goal.time} [s]</> : ''}
                        </p>
                        {(goal.startedAt || goal.endedAt) && (
                            <p className="text-muted mb-2">
                                {goal.startedAt && <span>{t('from')}: {formatDate(goal.startedAt)}</span>}
                                {goal.endedAt && <><span className="mx-2">{t('to')}:</span> <span>{formatDate(goal.endedAt)}</span></>}
                            </p>
                        )}
                        <div className="d-flex align-items-center gap-2 mt-3">
                            <strong>{t('goalStatus')}: </strong>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {GoalStatusEnum.getOptions(t).find(opt => String(opt.value) === String(goal.status))?.label || goal.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="mb-3 text-profile-primary fw-bold">{t('participants')}</h5>
                    <GoalDetailsParticipantsTable
                        participants={goal.participants || []}
                        relatedUsers={relatedUsers}
                        currentUser={currentUser}
                        actionLoading={interactions.actionLoading}
                        onUpdateStatus={interactions.handleParticipantStatusSubmit}
                    />
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <h5 className="mb-3 text-profile-primary fw-bold">{t('results')}</h5>
                    <GoalDetailsResultsTable
                        participants={goal.participants || []}
                        relatedUsers={relatedUsers}
                        currentUser={currentUser}
                        actionLoading={interactions.actionLoading}
                        onUpdateStatus={interactions.handleResultStatusSubmit}
                    />
                </div>
            </div>
        </div>
    );
};