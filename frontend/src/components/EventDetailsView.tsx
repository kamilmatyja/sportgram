import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {EventResponse} from '../api/responses/EventResponse';
import {PageResponse} from '../api/responses/PageResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {EventBody} from '../api/body/EventBody';
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
    loading: boolean;
    submitLoading: boolean;
    error: string | null;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    successMsg: string;
    formData: EventBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
    addDiscipline: () => void;
    updateDisciplineType: (index: number, type: number) => void;
    removeDiscipline: (index: number) => void;
    addDistance: (discIndex: number) => void;
    updateDistanceValue: (discIndex: number, distIndex: number, val: number) => void;
    removeDistance: (discIndex: number, distIndex: number) => void;
    addSubDistance: (discIndex: number, distIndex: number) => void;
    updateSubDistanceValue: (discIndex: number, distIndex: number, subIndex: number, val: number) => void;
    removeSubDistance: (discIndex: number, distIndex: number, subIndex: number) => void;
    openListsModal: (distId: string) => void;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
                                                                      eventObj,
                                                                      ownerPage,
                                                                      currentUser,
                                                                      isMyProfile,
                                                                      isAdmin,
                                                                      loading,
                                                                      submitLoading,
                                                                      error,
                                                                      globalError,
                                                                      fieldErrors,
                                                                      successMsg,
                                                                      formData,
                                                                      handleChange,
                                                                      handleEditSubmit,
                                                                      handleStatusSubmit,
                                                                      handleDelete,
                                                                      addDiscipline,
                                                                      updateDisciplineType,
                                                                      removeDiscipline,
                                                                      addDistance,
                                                                      updateDistanceValue,
                                                                      removeDistance,
                                                                      addSubDistance,
                                                                      updateSubDistanceValue,
                                                                      removeSubDistance,
                                                                      openListsModal
                                                                  }) => {
    const {t} = useTranslation();

    if (loading) return <div className="container mt-5 text-center"><div className="spinner-border"/></div>;

    if (error || !eventObj || !currentUser) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const hexColor = ownerPage ? ColorEnum.getHex(ownerPage.color) : ColorEnum.getHex(currentUser.color);

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
                    <h4 className="mb-4">{t('eventDetails')}</h4>

                    {globalError && <div className="alert alert-danger">{t(globalError)}</div>}
                    {successMsg && <div className="alert alert-success">{t(successMsg)}</div>}

                    {isMyProfile ? (
                        <form id="edit-event-form" onSubmit={handleEditSubmit} className="mb-4 pb-3 border-bottom">
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">{t('startedAt')}</label>
                                    <input type="datetime-local" name="startedAt"
                                           className={`form-control ${fieldErrors.startedAt ? 'is-invalid' : ''}`}
                                           value={formData.startedAt} onChange={handleChange} required/>
                                    {fieldErrors.startedAt && <div className="invalid-feedback d-block">{fieldErrors.startedAt}</div>}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('endedAt')}</label>
                                    <input type="datetime-local" name="endedAt"
                                           className={`form-control ${fieldErrors.endedAt ? 'is-invalid' : ''}`}
                                           value={formData.endedAt} onChange={handleChange} required/>
                                    {fieldErrors.endedAt && <div className="invalid-feedback d-block">{fieldErrors.endedAt}</div>}
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">{t('title')}</label>
                                    <input type="text" name="title"
                                           className={`form-control ${fieldErrors.title ? 'is-invalid' : ''}`}
                                           value={formData.title} onChange={handleChange} required/>
                                    {fieldErrors.title && <div className="invalid-feedback d-block">{fieldErrors.title}</div>}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('link')}</label>
                                    <input type="text" name="link"
                                           className={`form-control ${fieldErrors.link ? 'is-invalid' : ''}`}
                                           value={formData.link} onChange={handleChange} required/>
                                    {fieldErrors.link && <div className="invalid-feedback d-block">{fieldErrors.link}</div>}
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('location')}</label>
                                <input type="text" name="location"
                                       className={`form-control ${fieldErrors.location ? 'is-invalid' : ''}`}
                                       value={formData.location} onChange={handleChange} required/>
                                {fieldErrors.location && <div className="invalid-feedback d-block">{fieldErrors.location}</div>}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('description')}</label>
                                <textarea name="description"
                                          className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                                          value={formData.description} onChange={handleChange} required rows={3}/>
                                {fieldErrors.description && <div className="invalid-feedback d-block">{fieldErrors.description}</div>}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('rules')}</label>
                                <textarea name="rules"
                                          className={`form-control ${fieldErrors.rules ? 'is-invalid' : ''}`}
                                          value={formData.rules} onChange={handleChange} required rows={3}/>
                                {fieldErrors.rules && <div className="invalid-feedback d-block">{fieldErrors.rules}</div>}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('photo')}</label>
                                <input type="file" accept="image/*" name="photo"
                                       className={`form-control ${fieldErrors.photo ? 'is-invalid' : ''}`}
                                       onChange={handleChange}/>
                                <div className="form-text">{t('photoOptional')}</div>
                                {fieldErrors.photo && <div className="invalid-feedback d-block">{fieldErrors.photo}</div>}
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                                <h6 className="card-title text-profile-primary mb-0">{t('disciplinesAndDistances')}</h6>
                                <button type="button" className="btn btn-sm btn-profile-outline-primary" onClick={addDiscipline}>
                                    {t('addDisciplineBtn')}
                                </button>
                            </div>

                            {formData.disciplines?.map((disc, dIndex) => (
                                <div key={dIndex} className="border rounded p-3 mb-3 bg-white">
                                    <div className="d-flex justify-content-between align-items-end mb-3">
                                        <div className="flex-grow-1 me-3">
                                            <label className="form-label">{t('discipline')}</label>
                                            <select className="form-select" value={disc.discipline}
                                                    onChange={e => updateDisciplineType(dIndex, parseInt(e.target.value))}>
                                                {DisciplineEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <button type="button" className="btn btn-outline-danger" onClick={() => removeDiscipline(dIndex)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>

                                    <div className="ps-4 border-start border-2 border-profile-primary">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="fw-bold">{t('distances')}</span>
                                            <button type="button" className="btn btn-sm btn-profile-outline-primary" onClick={() => addDistance(dIndex)}>
                                                {t('addDistanceBtn')}
                                            </button>
                                        </div>

                                        {disc.distances?.map((dist, distIndex) => (
                                            <div key={distIndex} className="card mb-2 shadow-none border">
                                                <div className="card-body p-2">
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <div className="input-group input-group-sm w-50">
                                                            <span className="input-group-text">{t('distanceMeters')}</span>
                                                            <input type="number" className="form-control" value={dist.distance}
                                                                   onChange={e => updateDistanceValue(dIndex, distIndex, parseInt(e.target.value) || 0)}/>
                                                        </div>
                                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeDistance(dIndex, distIndex)}>
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>

                                                    <div className="ps-3 border-start">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <small className="text-muted">{t('subDistances')}</small>
                                                            <button type="button" className="btn btn-xs btn-profile-outline-primary py-0 px-2" onClick={() => addSubDistance(dIndex, distIndex)}>
                                                                {t('addSubDistanceBtn')}
                                                            </button>
                                                        </div>
                                                        {dist.subDistances?.map((sub, subIndex) => (
                                                            <div key={subIndex} className="d-flex align-items-center gap-2 mt-1">
                                                                <input type="number" className="form-control form-control-sm w-50" placeholder={t('subDistanceMeters')} value={sub.subDistance}
                                                                       onChange={e => updateSubDistanceValue(dIndex, distIndex, subIndex, parseInt(e.target.value) || 0)}/>
                                                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeSubDistance(dIndex, distIndex, subIndex)}>
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitLoading}>
                                    {submitLoading ? t('sending') : t('delete')}
                                </button>
                                <button type="submit" className="btn btn-profile-primary" disabled={submitLoading}>
                                    {submitLoading ? t('sending') : t('saveChanges')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-4 pb-4 border-bottom">
                            <div className="text-center mb-4">
                                {eventObj.photo && (
                                    <img src={`data:image/webp;base64,${eventObj.photo}`} alt="Event photo" className="img-fluid rounded shadow-sm" style={{maxHeight: '300px', objectFit: 'cover'}} />
                                )}
                            </div>
                            <h3 className="fw-bold">{eventObj.title}</h3>
                            <p className="text-muted mb-2">
                                <i className="bi bi-geo-alt me-1"></i> {eventObj.location}
                            </p>
                            <p className="text-muted mb-3">
                                <span>{t('from')}: {formatDate(eventObj.startedAt)}</span>
                                <span className="mx-2">|</span>
                                <span>{t('to')}: {formatDate(eventObj.endedAt)}</span>
                            </p>
                            <div className="mb-3">
                                <h5>{t('description')}</h5>
                                <p style={{whiteSpace: 'pre-wrap'}}>{eventObj.description}</p>
                            </div>
                            <div className="mb-3">
                                <h5>{t('rules')}</h5>
                                <p style={{whiteSpace: 'pre-wrap'}}>{eventObj.rules}</p>
                            </div>
                            {eventObj.disciplines && eventObj.disciplines.length > 0 && (
                                <div className="mt-4">
                                    <h5 className="fw-bold">{t('disciplinesAndDistances')}</h5>
                                    {eventObj.disciplines.map(disc => (
                                        <div key={disc.id} className="mb-3 ms-2 p-3 border rounded bg-light">
                                            <strong className="fs-5 text-profile-primary">{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(disc.discipline))?.label || disc.discipline}</strong>
                                            {disc.distances && disc.distances.length > 0 && (
                                                <ul className="mb-0 mt-2 list-unstyled ms-3">
                                                    {disc.distances.map(dist => (
                                                        <li key={dist.id} className="mb-2">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <i className="bi bi-signpost-split text-muted"></i>
                                                                <span className="fw-bold">{dist.distance} [m]</span>
                                                                <button type="button" className="btn btn-xs btn-profile-outline-primary py-0 px-2 ms-2" onClick={() => openListsModal(dist.id)}>
                                                                    <i className="bi bi-list-ul me-1"></i> {t('eventTypes.eventDisciplineList')}
                                                                </button>
                                                            </div>
                                                            {dist.subDistances && dist.subDistances.length > 0 && (
                                                                <ul className="mb-0 mt-1 list-unstyled ms-4 text-muted small">
                                                                    {dist.subDistances.map(sub => (
                                                                        <li key={sub.id}>
                                                                            <i className="bi bi-dash me-1"></i>
                                                                            {sub.subDistance} [m]
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {(isMyProfile || isAdmin) && (
                        <div className="mb-4">
                            <h6 className="mb-3">{t('eventStatus')}</h6>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <strong>{t('status')}:</strong>
                                <span className="me-2 badge bg-light text-dark border profile-theme-border">
                                    {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(eventObj.status))?.label || eventObj.status}
                                </span>
                                {ElementStatusEnum.getOptions(t)
                                    .filter(opt => opt.value !== eventObj.status)
                                    .filter(opt => isAdmin || (isMyProfile && opt.value !== ElementStatusEnum.REJECTED))
                                    .map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                            disabled={submitLoading}
                                            onClick={() => handleStatusSubmit(opt.value)}
                                        >
                                            {submitLoading ? t('loading') : opt.label}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};