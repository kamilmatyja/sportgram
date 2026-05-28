import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserUpdateBody} from '../../api/body/UserUpdateBody';
import {UserResponse} from '../../api/responses/UserResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {CountryEnum} from '../../enums/CountryEnum';
import {GenderEnum} from '../../enums/GenderEnum';
import {LanguageEnum} from '../../enums/LanguageEnum';
import {ThemeEnum} from '../../enums/ThemeEnum';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {UserStatusEnum} from '../../enums/UserStatusEnum';

interface ManageUserModalProps {
    themeColor?: number;
    show: boolean;
    managedUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: UserUpdateBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageUserModal: React.FC<ManageUserModalProps> = ({
                                                                    themeColor,
                                                                    show,
                                                                    managedUser,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    closeModal,
                                                                    loading,
                                                                    globalError,
                                                                    fieldErrors,
                                                                    formData,
                                                                    handleChange,
                                                                    handleEditSubmit,
                                                                    handleStatusSubmit,
                                                                    handleDelete
                                                                }) => {
    const {t} = useTranslation();

    if (!show || !managedUser) return null;

    const themeClass = themeColor ? ColorEnum.getClass(themeColor) : '';

    return (
        <>
            <div className={`modal d-block ${themeClass}`} tabIndex={-1}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('manageUser')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                            {isMyProfile && (
                                <form id="edit-user-form" onSubmit={handleEditSubmit}
                                      className="mb-4 pb-3 border-bottom">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">{t('firstName')}</label>
                                            <input name="firstName"
                                                   className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`}
                                                   value={formData.firstName || ''} onChange={handleChange} required/>
                                            {fieldErrors.firstName &&
                                                <div className="invalid-feedback d-block">{fieldErrors.firstName}</div>}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">{t('lastName')}</label>
                                            <input name="lastName"
                                                   className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`}
                                                   value={formData.lastName || ''} onChange={handleChange} required/>
                                            {fieldErrors.lastName &&
                                                <div className="invalid-feedback d-block">{fieldErrors.lastName}</div>}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">{t('email')}</label>
                                            <input type="email" name="email"
                                                   className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                                   value={formData.email || ''} onChange={handleChange} required/>
                                            {fieldErrors.email &&
                                                <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">{t('password')}</label>
                                            <input type="password" name="password"
                                                   className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                                                   value={formData.password || ''} onChange={handleChange}
                                                   minLength={8}/>
                                            <div className="form-text">{t('passwordOptional')}</div>
                                            {fieldErrors.password &&
                                                <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">{t('phone')}</label>
                                            <input type="number" name="phone"
                                                   className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                                                   value={formData.phone || ''} onChange={handleChange} required/>
                                            {fieldErrors.phone &&
                                                <div className="invalid-feedback d-block">{fieldErrors.phone}</div>}
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">{t('birthAt')}</label>
                                            <input type="date" name="birthAt"
                                                   className={`form-control ${fieldErrors.birthAt ? 'is-invalid' : ''}`}
                                                   value={formData.birthAt || ''} onChange={handleChange} required/>
                                            {fieldErrors.birthAt &&
                                                <div className="invalid-feedback d-block">{fieldErrors.birthAt}</div>}
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">{t('link')}</label>
                                            <input type="text" name="link"
                                                   className={`form-control ${fieldErrors.link ? 'is-invalid' : ''}`}
                                                   value={formData.link || ''} onChange={handleChange} required/>
                                            {fieldErrors.link &&
                                                <div className="invalid-feedback d-block">{fieldErrors.link}</div>}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">{t('gender')}</label>
                                            <select name="gender" className="form-select" value={formData.gender || ''}
                                                    onChange={handleChange} required>
                                                <option value="">{t('gender')}</option>
                                                {GenderEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                                             value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">{t('country')}</label>
                                            <select name="country" className="form-select"
                                                    value={formData.country || ''}
                                                    onChange={handleChange} required>
                                                <option value="">{t('country')}</option>
                                                {CountryEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                                              value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">{t('language')}</label>
                                            <select name="language" className="form-select"
                                                    value={formData.language || ''}
                                                    onChange={handleChange} required>
                                                <option value="">{t('language')}</option>
                                                {LanguageEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                                               value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">{t('theme')}</label>
                                            <select name="theme" className="form-select" value={formData.theme || ''}
                                                    onChange={handleChange} required>
                                                <option value="">{t('theme')}</option>
                                                {ThemeEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                                            value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">{t('color')}</label>
                                            <select name="color" className="form-select" value={formData.color || ''}
                                                    onChange={handleChange} required>
                                                <option value="">{t('color')}</option>
                                                {ColorEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                                            value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{t('discipline')}</label>
                                        <select name="disciplines"
                                                className={`form-select ${fieldErrors.disciplines ? 'is-invalid' : ''}`}
                                                value={Array.isArray(formData.disciplines) ? formData.disciplines.map(String) : []}
                                                onChange={handleChange} multiple>
                                            {DisciplineEnum.getOptions(t).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {fieldErrors.disciplines &&
                                            <div className="invalid-feedback d-block">{fieldErrors.disciplines}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{t('bio')}</label>
                                        <textarea name="bio"
                                                  className={`form-control ${fieldErrors.bio ? 'is-invalid' : ''}`}
                                                  rows={4} value={formData.bio || ''} onChange={handleChange} required/>
                                        {fieldErrors.bio &&
                                            <div className="invalid-feedback d-block">{fieldErrors.bio}</div>}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">{t('profilePhoto')}</label>
                                            <input type="file" accept="image/*"
                                                   className={`form-control ${fieldErrors.profilePhoto ? 'is-invalid' : ''}`}
                                                   name="profilePhoto" onChange={handleChange}/>
                                            <div className="form-text">{t('photoOptional')}</div>
                                            {fieldErrors.profilePhoto &&
                                                <div
                                                    className="invalid-feedback d-block">{fieldErrors.profilePhoto}</div>}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">{t('backgroundPhoto')}</label>
                                            <input type="file" accept="image/*"
                                                   className={`form-control ${fieldErrors.backgroundPhoto ? 'is-invalid' : ''}`}
                                                   name="backgroundPhoto" onChange={handleChange}/>
                                            <div className="form-text">{t('photoOptional')}</div>
                                            {fieldErrors.backgroundPhoto &&
                                                <div
                                                    className="invalid-feedback d-block">{fieldErrors.backgroundPhoto}</div>}
                                        </div>
                                    </div>
                                </form>
                            )}

                            {isAdmin && (
                                <div className="mb-4">
                                    <h6 className="mb-3">{t('manageUserStatus')}</h6>
                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                        <strong>{t('userStatus')}: </strong>
                                        <span className="badge bg-light text-dark border profile-theme-border">
                                            {UserStatusEnum.getOptions(t).find(opt => String(opt.value) === String(managedUser.status))?.label || managedUser.status}
                                        </span>
                                        {UserStatusEnum.getNanoOptions(t)
                                            .filter(opt => opt.value !== managedUser.status)
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

                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
                                {t('cancel')}
                            </button>
                            {isMyProfile && (
                                <>
                                    <button type="button" className="btn btn-danger" onClick={handleDelete}
                                            disabled={loading}>
                                        {loading ? t('sending') : t('delete')}
                                    </button>
                                    <button type="submit" form="edit-user-form" className="btn btn-profile-primary"
                                            disabled={loading}>
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