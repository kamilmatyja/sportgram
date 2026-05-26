import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {EventResponse} from '../api/responses/EventResponse';
import {PageResponse} from '../api/responses/PageResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {ColorEnum} from '../enums/ColorEnum';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {formatDate} from '../utils/dateFormat';

interface EventDetailsViewProps {
    eventObj: EventResponse | null;
    ownerPage: PageResponse | null;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    isParticipant: boolean;
    userEnrollments: string[];
    loading: boolean;
    actionLoading: boolean;
    error: string | null;
    onManageClick: (eventObj: EventResponse) => void;
    handleEnroll: (distId: string) => void;
    openListsModal: (distId: string) => void;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
                                                                      eventObj,
                                                                      ownerPage,
                                                                      currentUser,
                                                                      isMyProfile,
                                                                      isAdmin,
                                                                      isParticipant,
                                                                      userEnrollments,
                                                                      loading,
                                                                      actionLoading,
                                                                      error,
                                                                      onManageClick,
                                                                      handleEnroll,
                                                                      openListsModal
                                                                  }) => {
    const {t} = useTranslation();

    if (loading) return <div className="container mt-5 text-center"><div className="spinner-border"/></div>;

    if (error || !eventObj || !currentUser) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const hexColor = ownerPage ? ColorEnum.getHex(ownerPage.color) : ColorEnum.getHex(currentUser.color);
    const canManage = isMyProfile || isAdmin;

    return (
        <div className="container mt-4 mb-5" style={{'--theme-color': hexColor} as React.CSSProperties}>
            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                <a href="/events" className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('events')}
                </a>
                {ownerPage && (
                    <a href={`/pages/${ownerPage.link}`} className="btn btn-profile-outline-primary">
                        <i className="bi bi-file-earmark-text me-1"></i> {ownerPage.title}
                    </a>
                )}
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0">{eventObj.title}</h4>
                        {canManage && (
                            <button className="btn btn-profile-primary" onClick={() => onManageClick(eventObj)}>
                                <i className="bi bi-gear me-1"></i> {t('manage')}
                            </button>
                        )}
                    </div>

                    <div className="mb-4 border-bottom pb-4">
                        <div className="text-center mb-4">
                            {eventObj.photo && (
                                <img src={`data:image/webp;base64,${eventObj.photo}`} alt="Event photo" className="img-fluid rounded shadow-sm event-details-photo" />
                            )}
                        </div>
                        <p className="text-muted mb-2">
                            <i className="bi bi-geo-alt me-1"></i> {eventObj.location}
                        </p>
                        <p className="text-muted mb-3">
                            <span>{t('from')}: {formatDate(eventObj.startedAt)}</span>
                            <span className="mx-2">|</span>
                            <span>{t('to')}: {formatDate(eventObj.endedAt)}</span>
                        </p>
                        <div className="d-flex align-items-center gap-2 mt-2 mb-4">
                            <strong>{t('eventStatus')}: </strong>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(eventObj.status))?.label || eventObj.status}
                            </span>
                        </div>
                        <div className="mb-3">
                            <h5>{t('description')}</h5>
                            <p>{eventObj.description}</p>
                        </div>
                        <div className="mb-3">
                            <h5>{t('rules')}</h5>
                            <p>{eventObj.rules}</p>
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
                                    <th>{t('subDistances')}</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {eventObj.disciplines.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center text-muted">{t('noRecords')}</td></tr>
                                ) : eventObj.disciplines.flatMap(disc =>
                                    disc.distances.map(dist => (
                                        <tr key={dist.id}>
                                            <td>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(disc.discipline))?.label || disc.discipline}</td>
                                            <td>{dist.distance}</td>
                                            <td>
                                                {dist.subDistances && dist.subDistances.length > 0 ? (
                                                    <ul className="mb-0 list-unstyled small">
                                                        {dist.subDistances.map(sub => (
                                                            <li key={sub.id}>
                                                                <i className="bi bi-dash me-1"></i>
                                                                {sub.subDistance} [m]
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                <div className="d-flex justify-content-end gap-2 flex-wrap">
                                                    {isParticipant && !userEnrollments.includes(dist.id) && (
                                                        <button className="btn btn-sm btn-profile-primary" onClick={() => handleEnroll(dist.id)} disabled={actionLoading}>
                                                            {actionLoading ? <span className="spinner-border spinner-border-sm" /> : t('addBtn')}
                                                        </button>
                                                    )}
                                                    <button className="btn btn-sm btn-profile-outline-primary" onClick={() => openListsModal(dist.id)}>
                                                        <i className="bi bi-list-ul me-1"></i> {t('eventTypes.eventDisciplineList')}
                                                    </button>
                                                </div>
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