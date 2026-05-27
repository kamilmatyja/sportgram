import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { ColorEnum } from '../../enums/ColorEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { formatDate } from '../../utils/dateFormat';
import { UserSubpageHeader } from '../User/UserSubpageHeader';
import { GoalDetailsParticipantsTable } from './GoalDetailsParticipantsTable';
import { GoalDetailsResultsTable } from './GoalDetailsResultsTable';

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
            <UserSubpageHeader user={ownerUser} />

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-3 text-profile-primary fw-bold"><i className="bi bi-info-circle me-2"></i>{t('basicInformation')}</h4>
                        {canManage && (
                            <button className="btn btn-profile-primary" onClick={() => onManageClick(goal)}>
                                <i className="bi bi-gear me-1"></i> {t('manage')}
                            </button>
                        )}
                    </div>

                    <div className="mb-2">
                        <p className="mb-4 text-break fs-5">{goal.text}</p>

                        <div className="row g-3">
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('discipline')}</div>
                                <div className="fw-medium">
                                    {DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(goal.discipline))?.label || goal.discipline}
                                </div>
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('distance')}</div>
                                <div className="fw-medium">{goal.distance} [m]</div>
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('time')}</div>
                                <div className="fw-medium">{goal.time ? `${goal.time} [s]` : '-'}</div>
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('startedAt')}</div>
                                <div className="fw-medium">{goal.startedAt ? formatDate(goal.startedAt) : '-'}</div>
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('endedAt')}</div>
                                <div className="fw-medium">{goal.endedAt ? formatDate(goal.endedAt) : '-'}</div>
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('goalStatus')}</div>
                                <div>
                                    <span className="badge bg-light text-dark border profile-theme-border">
                                        {GoalStatusEnum.getOptions(t).find(opt => String(opt.value) === String(goal.status))?.label || goal.status}
                                    </span>
                                </div>
                            </div>
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