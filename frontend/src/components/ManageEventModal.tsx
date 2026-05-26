import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {EventBody} from '../api/body/EventBody';
import {EventResultBody} from '../api/body/EventResultBody';
import {EventResponse} from '../api/responses/EventResponse';
import {EventDisciplineDistanceListResponse} from '../api/responses/EventDisciplineDistanceListResponse';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {ColorEnum} from '../enums/ColorEnum';
import {UserResponse} from '../api/responses/UserResponse';

interface ManageEventModalProps {
    user: UserResponse | null;
    show: boolean;
    currentEvent: EventResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
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

    selectedDistanceId: string;
    distanceLists: EventDisciplineDistanceListResponse[];
    listUsers: Record<string, UserResponse>;
    loadingLists: boolean;
    fetchDistanceLists: (id: string) => void;
    handleListStatusUpdate: (listId: string, status: number) => void;

    activeResultListId: string | null;
    setActiveResultListId: (id: string | null) => void;
    resultFormData: EventResultBody;
    setResultFormData: (v: any) => void;
    openAddResultForm: (list: EventDisciplineDistanceListResponse) => void;
    openEditResultForm: (list: EventDisciplineDistanceListResponse, resultId: string) => void;
    handleSaveResult: () => void;
    handleDeleteResult: (resultId: string) => void;
}

export const ManageEventModal: React.FC<ManageEventModalProps> = ({
                                                                      user, show, currentEvent, isMyProfile, isAdmin, closeModal, loading, globalError, fieldErrors,
                                                                      formData, handleChange, handleEditSubmit, handleStatusSubmit, handleDelete,
                                                                      addDiscipline, updateDisciplineType, removeDiscipline, addDistance, updateDistanceValue, removeDistance, addSubDistance, updateSubDistanceValue, removeSubDistance,
                                                                      selectedDistanceId, distanceLists, listUsers, loadingLists, fetchDistanceLists, handleListStatusUpdate,
                                                                      activeResultListId, setActiveResultListId, resultFormData, setResultFormData, openAddResultForm, openEditResultForm, handleSaveResult, handleDeleteResult
                                                                  }) => {
    const {t} = useTranslation();
    if (!show || !currentEvent || !user) return null;

    const hexColor = ColorEnum.getHex(user.color);

    const renderResultForm = (list: EventDisciplineDistanceListResponse) => {
        if (activeResultListId !== list.id) return null;

        const distanceObj = currentEvent.disciplines.flatMap(d => d.distances).find(d => d.id === list.eventDisciplineDistanceId);

        return (
            <div className="bg-white p-3 border rounded shadow-sm mt-3 border-profile-primary">
                <h6 className="text-profile-primary">{t('resultFormTitle')}</h6>
                <div className="mb-2">
                    <label className="form-label mb-0 small">{t('finalTimeSeconds')}</label>
                    <input type="number" className="form-control form-control-sm" value={resultFormData.time}
                           onChange={e => setResultFormData((prev: any) => ({...prev, time: parseInt(e.target.value) || 0}))}/>
                </div>
                {resultFormData.subResults.length > 0 && <strong className="small">{t('subDistances')}:</strong>}
                {resultFormData.subResults.map((sr, idx) => {
                    const sdMeta = distanceObj?.subDistances.find(sd => sd.id === sr.eventDisciplineSubDistanceId);
                    return (
                        <div key={idx} className="d-flex align-items-center gap-2 mb-1">
                            <span className="small text-muted w-50">{t('forDistance')} {sdMeta?.subDistance || '?'} [m]:</span>
                            <input type="number" className="form-control form-control-sm w-50"
                                   placeholder={t('timeSeconds')} value={sr.time} onChange={e => {
                                const newSubs = [...resultFormData.subResults];
                                newSubs[idx].time = parseInt(e.target.value) || 0;
                                setResultFormData((prev: any) => ({...prev, subResults: newSubs}));
                            }}/>
                        </div>
                    );
                })}
                <div className="mt-2 text-end">
                    <button className="btn btn-sm btn-secondary me-2" onClick={() => setActiveResultListId(null)}>{t('cancel')}</button>
                    <button className="btn btn-sm btn-profile-primary" onClick={handleSaveResult} disabled={loadingLists}>{t('saveResultBtn')}</button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('manageEvent')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                            {isMyProfile && (
                                <form id="edit-event-form" onSubmit={handleEditSubmit} className="mb-4 pb-3 border-bottom">
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">{t('startedAt')}</label>
                                            <input type="datetime-local" name="startedAt"
                                                   className={`form-control ${fieldErrors.startedAt ? 'is-invalid' : ''}`}
                                                   value={formData.startedAt} onChange={handleChange} required/>
                                            {fieldErrors.startedAt &&
                                                <div className="invalid-feedback d-block">{fieldErrors.startedAt}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('endedAt')}</label>
                                            <input type="datetime-local" name="endedAt"
                                                   className={`form-control ${fieldErrors.endedAt ? 'is-invalid' : ''}`}
                                                   value={formData.endedAt} onChange={handleChange} required/>
                                            {fieldErrors.endedAt &&
                                                <div className="invalid-feedback d-block">{fieldErrors.endedAt}</div>}
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">{t('title')}</label>
                                            <input type="text" name="title"
                                                   className={`form-control ${fieldErrors.title ? 'is-invalid' : ''}`}
                                                   value={formData.title} onChange={handleChange} required/>
                                            {fieldErrors.title &&
                                                <div className="invalid-feedback d-block">{fieldErrors.title}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('link')}</label>
                                            <input type="text" name="link"
                                                   className={`form-control ${fieldErrors.link ? 'is-invalid' : ''}`}
                                                   value={formData.link} onChange={handleChange} required/>
                                            {fieldErrors.link &&
                                                <div className="invalid-feedback d-block">{fieldErrors.link}</div>}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{t('location')}</label>
                                        <input type="text" name="location"
                                               className={`form-control ${fieldErrors.location ? 'is-invalid' : ''}`}
                                               value={formData.location} onChange={handleChange} required/>
                                        {fieldErrors.location &&
                                            <div className="invalid-feedback d-block">{fieldErrors.location}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{t('description')}</label>
                                        <textarea name="description"
                                                  className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                                                  value={formData.description} onChange={handleChange} required
                                                  rows={3}/>
                                        {fieldErrors.description &&
                                            <div className="invalid-feedback d-block">{fieldErrors.description}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{t('rules')}</label>
                                        <textarea name="rules"
                                                  className={`form-control ${fieldErrors.rules ? 'is-invalid' : ''}`}
                                                  value={formData.rules} onChange={handleChange} required rows={3}/>
                                        {fieldErrors.rules &&
                                            <div className="invalid-feedback d-block">{fieldErrors.rules}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{t('photo')}</label>
                                        <input type="file" accept="image/*" name="photo"
                                               className={`form-control ${fieldErrors.photo ? 'is-invalid' : ''}`}
                                               onChange={handleChange}/>
                                        <div className="form-text">{t('photoOptional')}</div>
                                        {fieldErrors.photo &&
                                            <div className="invalid-feedback d-block">{fieldErrors.photo}</div>}
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
                                                                    <input type="number" className="form-control"
                                                                           value={dist.distance}
                                                                           onChange={e => updateDistanceValue(dIndex, distIndex, parseInt(e.target.value) || 0)}/>
                                                                </div>
                                                                <button type="button" className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => removeDistance(dIndex, distIndex)}><i
                                                                    className="bi bi-trash"></i></button>
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
                                                                        <input type="number" className="form-control form-control-sm w-50"
                                                                               placeholder={t('subDistanceMeters')} value={sub.subDistance}
                                                                               onChange={e => updateSubDistanceValue(dIndex, distIndex, subIndex, parseInt(e.target.value) || 0)}/>
                                                                        <button type="button" className="btn btn-sm btn-outline-danger"
                                                                                onClick={() => removeSubDistance(dIndex, distIndex, subIndex)}><i
                                                                            className="bi bi-trash"></i></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </form>
                            )}

                            {(isMyProfile || isAdmin) && (
                                <div className="mb-4 border-bottom pb-3">
                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                        <strong>{t('eventStatus')}:</strong>
                                        <span className="me-2 badge bg-light text-dark border profile-theme-border">
                                            {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(currentEvent.status))?.label || currentEvent.status}
                                        </span>
                                        {ElementStatusEnum.getOptions(t)
                                            .filter(opt => opt.value !== currentEvent.status)
                                            .filter(opt => isAdmin || (isMyProfile && opt.value !== ElementStatusEnum.REJECTED))
                                            .map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                                    disabled={loading}
                                                    onClick={() => handleStatusSubmit(opt.value)}
                                                >
                                                    {loading ? t('loading') : opt.label}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {isMyProfile && (
                                <div>
                                    <h6 className="text-profile-primary mb-3">{t('manageListsAndResults')}</h6>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">{t('selectDistanceSavedChanges')}</label>
                                        <select className="form-select" value={selectedDistanceId}
                                                onChange={e => fetchDistanceLists(e.target.value)}>
                                            <option value="">{t('selectDistance')}</option>
                                            {currentEvent.disciplines.flatMap(d => d.distances.map(dist => ({
                                                id: dist.id,
                                                label: `${DisciplineEnum.getOptions(t).find(o => o.value === d.discipline)?.label} - ${dist.distance}m`
                                            }))).map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {loadingLists && <div className="text-center"><div className="spinner-border spinner-border-sm text-profile-primary"/></div>}

                                    {!loadingLists && selectedDistanceId && distanceLists.length > 0 && (
                                        <div className="mt-3">
                                            {distanceLists.map(list => {
                                                const u = listUsers[list.userId];
                                                const res = list.results && list.results.length > 0 ? list.results[0] : null;

                                                return (
                                                    <div key={list.id} className="border p-2 mb-2 rounded bg-light">
                                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                            <div>
                                                                <strong>{u ? `${u.firstName} ${u.lastName}` : list.userId}</strong>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="me-2 badge bg-light text-dark border profile-theme-border">{SaveStatusEnum.getOptions(t).find(o => o.value === list.status)?.label}</span>
                                                                {SaveStatusEnum.getOptions(t)
                                                                    .filter(opt => opt.value !== list.status)
                                                                    .filter(opt => opt.value !== SaveStatusEnum.PENDING)
                                                                    .map(opt => (
                                                                        <button
                                                                            key={opt.value}
                                                                            type="button"
                                                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                                                            disabled={loadingLists}
                                                                            onClick={() => handleListStatusUpdate(list.id, opt.value)}
                                                                        >
                                                                            {loadingLists ? t('loading') : opt.label}
                                                                        </button>
                                                                    ))}
                                                            </div>
                                                        </div>

                                                        {list.status === SaveStatusEnum.ACCEPTED && (
                                                            <div className="mt-2 pt-2 border-top">
                                                                {!res ? (
                                                                    <button className="btn btn-sm btn-profile-outline-primary"
                                                                            onClick={() => openAddResultForm(list)}>{t('enterResultBtn')}
                                                                    </button>
                                                                ) : (
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <span className="text-success fw-bold">{t('time')}: {res.time}s</span>
                                                                        <div>
                                                                            <button className="btn btn-sm btn-profile-outline-primary me-1"
                                                                                    onClick={() => openEditResultForm(list, res.id)}>
                                                                                <i className="bi bi-pencil"></i>
                                                                            </button>
                                                                            <button className="btn btn-sm btn-outline-danger"
                                                                                    onClick={() => handleDeleteResult(res.id)}>
                                                                                <i className="bi bi-trash"></i>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {renderResultForm(list)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {!loadingLists && selectedDistanceId && distanceLists.length === 0 && (
                                        <div className="text-muted small mt-2">{t('noRegistrationsForDistance')}</div>
                                    )}
                                </div>
                            )}

                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeModal}
                                    disabled={loading || loadingLists}>
                                {t('cancel')}
                            </button>
                            {isMyProfile && (
                                <>
                                    <button type="button" className="btn btn-danger" onClick={handleDelete}
                                            disabled={loading || loadingLists}>
                                        {loading ? t('sending') : t('delete')}
                                    </button>
                                    <button type="submit" form="edit-event-form" className="btn btn-profile-primary"
                                            disabled={loading || loadingLists}>
                                        {loading ? t('sending') : t('saveChanges')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};