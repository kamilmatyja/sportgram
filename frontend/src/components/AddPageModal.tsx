import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {PageBody} from '../api/body/PageBody';
import {ColorEnum} from '../enums/ColorEnum';
import {UserResponse} from '../api/responses/UserResponse';

interface AddPageModalProps {
    user: UserResponse | null;
    show: boolean;
    availableUsers: UserResponse[];
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: PageBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddPageModal: React.FC<AddPageModalProps> = ({
                                                              user,
                                                              show,
                                                              availableUsers,
                                                              closeModal,
                                                              loading,
                                                              globalError,
                                                              fieldErrors,
                                                              formData,
                                                              handleChange,
                                                              handleParticipantsChange,
                                                              handleSubmit
                                                          }) => {
    const {t} = useTranslation();
    if (!show || !user) return null;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{t('addPage')}</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                                <div className="mb-3">
                                    <label className="form-label">{t('title')}</label>
                                    <input type="text" name="title"
                                           className={`form-control ${fieldErrors.title ? 'is-invalid' : ''}`}
                                           value={formData.title} onChange={handleChange} required/>
                                    {fieldErrors.title &&
                                        <div className="invalid-feedback d-block">{fieldErrors.title}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">{t('description')}</label>
                                    <textarea name="description"
                                              className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                                              value={formData.description} onChange={handleChange} required rows={3}/>
                                    {fieldErrors.description &&
                                        <div className="invalid-feedback d-block">{fieldErrors.description}</div>}
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">{t('link')}</label>
                                        <input type="text" name="link"
                                               className={`form-control ${fieldErrors.link ? 'is-invalid' : ''}`}
                                               value={formData.link} onChange={handleChange} required/>
                                        {fieldErrors.link &&
                                            <div className="invalid-feedback d-block">{fieldErrors.link}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('color')}</label>
                                        <select name="color"
                                                className={`form-select ${fieldErrors.color ? 'is-invalid' : ''}`}
                                                value={formData.color || ''} onChange={handleChange} required>
                                            <option value="">{t('selectOption')}</option>
                                            {ColorEnum.getOptions(t).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {fieldErrors.color &&
                                            <div className="invalid-feedback d-block">{fieldErrors.color}</div>}
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">{t('profilePhoto')}</label>
                                        <input type="file" accept="image/*" name="profilePhoto"
                                               className={`form-control ${fieldErrors.profilePhoto ? 'is-invalid' : ''}`}
                                               onChange={handleChange} required/>
                                        {fieldErrors.profilePhoto &&
                                            <div className="invalid-feedback d-block">{fieldErrors.profilePhoto}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('backgroundPhoto')}</label>
                                        <input type="file" accept="image/*" name="backgroundPhoto"
                                               className={`form-control ${fieldErrors.backgroundPhoto ? 'is-invalid' : ''}`}
                                               onChange={handleChange} required/>
                                        {fieldErrors.backgroundPhoto && <div
                                            className="invalid-feedback d-block">{fieldErrors.backgroundPhoto}</div>}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">{t('participants')}</label>
                                    <select
                                        name="participants"
                                        className={`form-select ${fieldErrors.participants ? 'is-invalid' : ''}`}
                                        value={Array.isArray(formData.participants) ? formData.participants : []}
                                        onChange={handleParticipantsChange}
                                        multiple
                                    >
                                        {availableUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.firstName} {u.lastName} ({u.link})
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.participants &&
                                        <div className="invalid-feedback d-block">{fieldErrors.participants}</div>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary"
                                        onClick={closeModal}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-profile-primary" disabled={loading}>
                                    {loading ? t('sending') : t('addPage')}
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