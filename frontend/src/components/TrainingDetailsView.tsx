import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {TrainingResponse} from '../api/responses/TrainingResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {ColorEnum} from '../enums/ColorEnum';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {formatDate} from '../utils/dateFormat';

interface TrainingDetailsViewProps {
    training: TrainingResponse | null;
    ownerUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    isParticipantOfTraining: boolean;
    loading: boolean;
    error: string | null;
    onManageClick: (training: TrainingResponse) => void;
}

export const TrainingDetailsView: React.FC<TrainingDetailsViewProps> = ({
                                                                            training,
                                                                            ownerUser,
                                                                            relatedUsers,
                                                                            isMyProfile,
                                                                            isAdmin,
                                                                            isParticipantOfTraining,
                                                                            loading,
                                                                            error,
                                                                            onManageClick
                                                                        }) => {
    const {t} = useTranslation();

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border"/>
    </div>;

    if (error || !training || !ownerUser) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const themeClass = ColorEnum.getClass(ownerUser.color);
    const canManage = isMyProfile || isAdmin || isParticipantOfTraining;

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`} tabIndex={-1}>
            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                <a href={`/users/${ownerUser.link}/trainings`} className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('trainings')}
                </a>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0">{training.title}</h4>
                        {canManage && (
                            <button className="btn btn-profile-primary" onClick={() => onManageClick(training)}>
                                <i className="bi bi-gear me-1"></i> {t('manage')}
                            </button>
                        )}
                    </div>

                    <div className="mb-4 border-bottom pb-4">
                        <p className="text-muted mb-2">
                            <i className="bi bi-geo-alt me-1"></i> {training.location}
                        </p>
                        <p className="mb-3">{training.description}</p>
                        <p className="text-muted mb-2">
                            <span>{t('from')}: {formatDate(training.startedAt)}</span>
                            <span className="mx-2">|</span>
                            <span>{t('to')}: {formatDate(training.endedAt)}</span>
                        </p>
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <strong>{t('trainingStatus')}: </strong>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(training.status))?.label || training.status}
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
                                {training.participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center text-muted">{t('noParticipants')}</td>
                                    </tr>
                                ) : training.participants.map(p => {
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
                        <h5 className="mb-3">{t('disciplinesAndDistances')}</h5>
                        <div className="table-responsive-custom">
                            <table className="table table-bordered table-hover align-middle mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th>{t('discipline')}</th>
                                    <th>{t('distance')} [m]</th>
                                    <th>{t('timeSeconds')}</th>
                                    <th>{t('subDistances')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {training.disciplines.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center text-muted">{t('noRecords')}</td>
                                    </tr>
                                ) : training.disciplines.flatMap(disc =>
                                    disc.distances.map(dist => (
                                        <tr key={dist.id}>
                                            <td>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(disc.discipline))?.label || disc.discipline}</td>
                                            <td>{dist.distance}</td>
                                            <td>{dist.time}</td>
                                            <td>
                                                {dist.subDistances && dist.subDistances.length > 0 ? (
                                                    <ul className="mb-0 list-unstyled small">
                                                        {dist.subDistances.map(sub => (
                                                            <li key={sub.id}>
                                                                <i className="bi bi-dash me-1"></i>
                                                                {sub.subDistance} [m] - {sub.time} [s]
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};