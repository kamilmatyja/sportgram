import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {UserSubpageHeader} from '../User/UserSubpageHeader';
import {TrainingDetailsParticipantsTable} from './TrainingDetailsParticipantsTable';
import {TrainingDetailsDisciplinesTable} from './TrainingDetailsDisciplinesTable';

interface TrainingDetailsViewProps {
    training: TrainingResponse | null;
    ownerUser: UserResponse | null;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    onManageClick: (training: TrainingResponse) => void;
    interactions: any;
}

export const TrainingDetailsView: React.FC<TrainingDetailsViewProps> = ({
                                                                            training,
                                                                            ownerUser,
                                                                            currentUser,
                                                                            relatedUsers,
                                                                            isMyProfile,
                                                                            isAdmin,
                                                                            loading,
                                                                            error,
                                                                            onManageClick,
                                                                            interactions
                                                                        }) => {
    const {t} = useTranslation();

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border text-profile-primary"/>
    </div>;
    if (error || !training || !ownerUser) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const themeClass = ColorEnum.getClass(ownerUser.color);
    const canManage = isMyProfile || isAdmin;

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={ownerUser}/>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-3 text-profile-primary fw-bold"><i
                            className="bi bi-info-circle me-2"></i>{t('basicInformation')}</h4>
                        {canManage && (
                            <button className="btn btn-profile-primary" onClick={() => onManageClick(training)}>
                                <i className="bi bi-gear me-1"></i> {t('manage')}
                            </button>
                        )}
                    </div>

                    <div className="mb-2">
                        <h4 className="mb-3 fw-bold">{training.title}</h4>
                        <p className="mb-4 text-break fs-5">{training.description}</p>

                        <div className="row g-3">
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('location')}</div>
                                <div className="fw-medium">
                                    <i className="bi bi-geo-alt me-1"></i> {training.location}
                                </div>
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('startedAt')}</div>
                                <div className="fw-medium">{formatDate(training.startedAt)}</div>
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('endedAt')}</div>
                                <div className="fw-medium">{formatDate(training.endedAt)}</div>
                            </div>
                            <div className="col-sm-6 col-md-4">
                                <div className="text-muted small mb-1">{t('trainingStatus')}</div>
                                <div>
                                    <span className="badge bg-light text-dark border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(training.status))?.label || training.status}
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
                    <TrainingDetailsParticipantsTable
                        participants={training.participants || []}
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
                    <TrainingDetailsDisciplinesTable disciplines={training.disciplines || []}/>
                </div>
            </div>
        </div>
    );
};