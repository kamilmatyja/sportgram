import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {GoalBody} from '../api/body/GoalBody';
import {ColorEnum} from '../enums/ColorEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {UserResponse} from '../api/responses/UserResponse';

interface AddGoalModalProps {
    user: UserResponse | null;
    show: boolean;
    availableUsers: UserResponse[];
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: GoalBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
                                                              user,
                                                              show,
                                                              availableUsers,
                                                              closeModal,
                                                              loading,
                                                              globalError,
                                                              fieldErrors,
                                                              formData,
                                                              handleChange,
                                                              handleSubmit
                                                          }) => {
    const {t} = useTranslation();
    if (!show || !user) return null;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{t('addGoal')}</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

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

                                <div className="mb-3">
                                    <label className="form-label">{t('title')}</label>
                                    <input type="text" name="text"
                                           className={`form-control ${fieldErrors.text ? 'is-invalid' : ''}`}
                                           value={formData.text} onChange={handleChange} required/>
                                    {fieldErrors.text && <div className="invalid-feedback d-block">{fieldErrors.text}</div>}
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label">{t('link')}</label>
                                        <input type="text" name="link"
                                               className={`form-control ${fieldErrors.link ? 'is-invalid' : ''}`}
                                               value={formData.link} onChange={handleChange} required/>
                                        {fieldErrors.link && <div className="invalid-feedback d-block">{fieldErrors.link}</div>}
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">{t('discipline')}</label>
                                        <select name="discipline"
                                                className={`form-select ${fieldErrors.discipline ? 'is-invalid' : ''}`}
                                                value={formData.discipline || ''} onChange={handleChange} required>
                                            <option value="">{t('selectOption')}</option>
                                            {DisciplineEnum.getOptions(t).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {fieldErrors.discipline && <div className="invalid-feedback d-block">{fieldErrors.discipline}</div>}
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">{t('distance')}</label>
                                        <input type="number" name="distance"
                                               className={`form-control ${fieldErrors.distance ? 'is-invalid' : ''}`}
                                               value={formData.distance || ''} onChange={handleChange} required/>
                                        {fieldErrors.distance && <div className="invalid-feedback d-block">{fieldErrors.distance}</div>}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">{t('time')}</label>
                                    <input type="number" name="time"
                                           className={`form-control ${fieldErrors.time ? 'is-invalid' : ''}`}
                                           value={formData.time || ''} onChange={handleChange}/>
                                    {fieldErrors.time && <div className="invalid-feedback d-block">{fieldErrors.time}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">{t('participants')}</label>
                                    <select
                                        name="participants"
                                        className={`form-select ${fieldErrors.participants ? 'is-invalid' : ''}`}
                                        value={Array.isArray(formData.participants) ? formData.participants.map(String) : []}
                                        onChange={handleChange}
                                        multiple
                                    >
                                        {availableUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.firstName} {u.lastName} ({u.link})
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.participants && <div className="invalid-feedback d-block">{fieldErrors.participants}</div>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-profile-primary" disabled={loading}>
                                    {loading ? t('sending') : t('addGoal')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};