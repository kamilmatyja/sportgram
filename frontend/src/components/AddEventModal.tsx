import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {EventBody} from '../api/body/EventBody';
import {ColorEnum} from '../enums/ColorEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {UserResponse} from '../api/responses/UserResponse';
import {PageResponse} from '../api/responses/PageResponse';

interface AddEventModalProps {
    user: UserResponse | null;
    show: boolean;
    myPages: PageResponse[];
    selectedPageId: string;
    setSelectedPageId: (id: string) => void;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: EventBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    addDiscipline: () => void;
    updateDisciplineType: (index: number, type: number) => void;
    removeDiscipline: (index: number) => void;
    addDistance: (discIndex: number) => void;
    updateDistanceValue: (discIndex: number, distIndex: number, val: number) => void;
    removeDistance: (discIndex: number, distIndex: number) => void;
    addSubDistance: (discIndex: number, distIndex: number) => void;
    updateSubDistanceValue: (discIndex: number, distIndex: number, subIndex: number, val: number) => void;
    removeSubDistance: (discIndex: number, distIndex: number, subIndex: number) => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
                                                                user,
                                                                show,
                                                                myPages,
                                                                selectedPageId,
                                                                setSelectedPageId,
                                                                closeModal,
                                                                loading,
                                                                globalError,
                                                                fieldErrors,
                                                                formData,
                                                                handleChange,
                                                                handleSubmit,
                                                                addDiscipline,
                                                                updateDisciplineType,
                                                                removeDiscipline,
                                                                addDistance,
                                                                updateDistanceValue,
                                                                removeDistance,
                                                                addSubDistance,
                                                                updateSubDistanceValue,
                                                                removeSubDistance
                                                            }) => {
    const {t} = useTranslation();
    if (!show || !user) return null;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('addEvent')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            <form id="add-event-form" onSubmit={handleSubmit}>
                                {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                                <div className="mb-3">
                                    <label className="form-label">{t('pageOrganizer')}</label>
                                    <select className="form-select" value={selectedPageId}
                                            onChange={e => setSelectedPageId(e.target.value)} required>
                                        <option value="">{t('selectPage')}</option>
                                        {myPages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>

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
                                              value={formData.description} onChange={handleChange} required rows={3}/>
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
                                           onChange={handleChange} required/>
                                    {fieldErrors.photo &&
                                        <div className="invalid-feedback d-block">{fieldErrors.photo}</div>}
                                </div>

                                <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                                    <h6 className="card-title text-profile-primary mb-0">{t('disciplinesAndDistances')}</h6>
                                    <button type="button" className="btn btn-sm btn-profile-outline-primary"
                                            onClick={addDiscipline}>
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
                                                    {DisciplineEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                                                     value={opt.value}>{opt.label}</option>)}
                                                </select>
                                            </div>
                                            <button type="button" className="btn btn-outline-danger"
                                                    onClick={() => removeDiscipline(dIndex)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>

                                        <div className="ps-4 border-start border-2 border-profile-primary">
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="fw-bold">{t('distances')}</span>
                                                <button type="button" className="btn btn-sm btn-profile-outline-primary"
                                                        onClick={() => addDistance(dIndex)}>
                                                    {t('addDistanceBtn')}
                                                </button>
                                            </div>

                                            {disc.distances?.map((dist, distIndex) => (
                                                <div key={distIndex} className="card mb-2 shadow-none border">
                                                    <div className="card-body p-2">
                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                            <div className="input-group input-group-sm w-50">
                                                                <span
                                                                    className="input-group-text">{t('distanceMeters')}</span>
                                                                <input type="number" className="form-control"
                                                                       value={dist.distance}
                                                                       onChange={e => updateDistanceValue(dIndex, distIndex, parseInt(e.target.value) || 0)}/>
                                                            </div>
                                                            <button type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => removeDistance(dIndex, distIndex)}><i
                                                                className="bi bi-trash"></i></button>
                                                        </div>

                                                        <div className="ps-3 border-start">
                                                            <div className="d-flex justify-content-between mb-2">
                                                                <small
                                                                    className="text-muted">{t('subDistances')}</small>
                                                                <button type="button"
                                                                        className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                                                        onClick={() => addSubDistance(dIndex, distIndex)}>
                                                                    {t('addSubDistanceBtn')}
                                                                </button>
                                                            </div>
                                                            {dist.subDistances?.map((sub, subIndex) => (
                                                                <div key={subIndex}
                                                                     className="d-flex align-items-center gap-2 mt-1">
                                                                    <input type="number"
                                                                           className="form-control form-control-sm w-50"
                                                                           placeholder={t('subDistanceMeters')}
                                                                           value={sub.subDistance}
                                                                           onChange={e => updateSubDistanceValue(dIndex, distIndex, subIndex, parseInt(e.target.value) || 0)}/>
                                                                    <button type="button"
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => removeSubDistance(dIndex, distIndex, subIndex)}>
                                                                        <i
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
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary"
                                    onClick={closeModal}>{t('cancel')}</button>
                            <button type="submit" className="btn btn-profile-primary" disabled={loading}
                                    form="add-event-form">
                                {loading ? t('sending') : t('addEvent')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};