import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { UserResponse } from '../api/responses/UserResponse';
import { UserUpdateBody } from '../api/body/UserUpdateBody';
import { ColorEnum } from '../enums/ColorEnum';
import { CountryEnum } from '../enums/CountryEnum';
import { GenderEnum } from '../enums/GenderEnum';
import { LanguageEnum } from '../enums/LanguageEnum';
import { ThemeEnum } from '../enums/ThemeEnum';
import { DisciplineEnum } from '../enums/DisciplineEnum';

interface UserSettingsViewProps {
    user: UserResponse | null;
    loading: boolean;
    submitLoading: boolean;
    error: string | null;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    successMsg: string;
    formData: UserUpdateBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({
                                                                      user, loading, submitLoading, error, globalError, fieldErrors, successMsg, formData, handleChange, handleSubmit
                                                                  }) => {
    const { t } = useTranslation();

    if (loading) return <div className="container mt-5 text-center"><div className="spinner-border" /></div>;

    if (error || !user) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <div className="container mt-4 mb-5" style={{ '--theme-color': hexColor } as React.CSSProperties}>
            <div className="card shadow-sm mb-4">
                <div className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                    <img src={`data:image/webp;base64,${user.backgroundPhoto}`} alt="Background" className="w-100 h-100 object-fit-cover" />
                </div>
                <div className="card-body position-relative pt-5">
                    <img src={`data:image/webp;base64,${user.profilePhoto}`} alt="Profile" className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover" />
                    <div className="mt-3">
                        <h2 className="mb-0 profile-theme-text">{user.firstName} {user.lastName}</h2>
                        <p className="text-muted mb-0">@{user.link}</p>
                    </div>
                </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                <a href={`/users/${user.link}`} className="btn btn-outline-primary">
                    <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i> {t('profile')}
                </a>
            </div>
            <div className="card shadow-sm">
                <div className="card-body">
                    <h4 className="mb-4">{t('settings')}</h4>

                    {globalError && <div className="alert alert-danger">{globalError}</div>}
                    {successMsg && <div className="alert alert-success">{t(successMsg)}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('firstName')}</label>
                                <input name="firstName" className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`} value={formData.firstName || ''} onChange={handleChange} required />
                                {fieldErrors.firstName && <div className="invalid-feedback d-block">{fieldErrors.firstName}</div>}
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('lastName')}</label>
                                <input name="lastName" className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`} value={formData.lastName || ''} onChange={handleChange} required />
                                {fieldErrors.lastName && <div className="invalid-feedback d-block">{fieldErrors.lastName}</div>}
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('email')}</label>
                                <input type="email" name="email" className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`} value={formData.email || ''} onChange={handleChange} required />
                                {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('password')}</label>
                                <input type="password" name="password" className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`} value={formData.password || ''} onChange={handleChange} minLength={8} />
                                <div className="form-text">{t('passwordOptional')}</div>
                                {fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">{t('phone')}</label>
                                <input type="number" name="phone" className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`} value={formData.phone || ''} onChange={handleChange} required />
                                {fieldErrors.phone && <div className="invalid-feedback d-block">{fieldErrors.phone}</div>}
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">{t('birthAt')}</label>
                                <input type="date" name="birthAt" className={`form-control ${fieldErrors.birthAt ? 'is-invalid' : ''}`} value={formData.birthAt || ''} onChange={handleChange} required />
                                {fieldErrors.birthAt && <div className="invalid-feedback d-block">{fieldErrors.birthAt}</div>}
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">{t('link')}</label>
                                <input type="text" name="link" className={`form-control ${fieldErrors.link ? 'is-invalid' : ''}`} value={formData.link || ''} onChange={handleChange} required />
                                {fieldErrors.link && <div className="invalid-feedback d-block">{fieldErrors.link}</div>}
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('gender')}</label>
                                <select name="gender" className="form-select" value={formData.gender || ''} onChange={handleChange} required>
                                    <option value="">{t('gender')}</option>
                                    {GenderEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('country')}</label>
                                <select name="country" className="form-select" value={formData.country || ''} onChange={handleChange} required>
                                    <option value="">{t('country')}</option>
                                    {CountryEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">{t('language')}</label>
                                <select name="language" className="form-select" value={formData.language || ''} onChange={handleChange} required>
                                    <option value="">{t('language')}</option>
                                    {LanguageEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">{t('theme')}</label>
                                <select name="theme" className="form-select" value={formData.theme || ''} onChange={handleChange} required>
                                    <option value="">{t('theme')}</option>
                                    {ThemeEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">{t('color')}</label>
                                <select name="color" className="form-select" value={formData.color || ''} onChange={handleChange} required>
                                    <option value="">{t('color')}</option>
                                    {ColorEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">{t('discipline')}</label>
                            <select name="disciplines" className={`form-select ${fieldErrors.disciplines ? 'is-invalid' : ''}`} value={Array.isArray(formData.disciplines) ? formData.disciplines.map(String) : []} onChange={handleChange} multiple>
                                {DisciplineEnum.getOptions(t).map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            {fieldErrors.disciplines && <div className="invalid-feedback d-block">{fieldErrors.disciplines}</div>}
                        </div>

                        <div className="mb-3">
                            <label className="form-label">{t('bio')}</label>
                            <textarea name="bio" className={`form-control ${fieldErrors.bio ? 'is-invalid' : ''}`} rows={4} value={formData.bio || ''} onChange={handleChange} required />
                            {fieldErrors.bio && <div className="invalid-feedback d-block">{fieldErrors.bio}</div>}
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('profilePhoto')}</label>
                                <input type="file" accept="image/*" className={`form-control ${fieldErrors.profilePhoto ? 'is-invalid' : ''}`} name="profilePhoto" onChange={handleChange} />
                                {fieldErrors.profilePhoto && <div className="invalid-feedback d-block">{fieldErrors.profilePhoto}</div>}
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('backgroundPhoto')}</label>
                                <input type="file" accept="image/*" className={`form-control ${fieldErrors.backgroundPhoto ? 'is-invalid' : ''}`} name="backgroundPhoto" onChange={handleChange} />
                                {fieldErrors.backgroundPhoto && <div className="invalid-feedback d-block">{fieldErrors.backgroundPhoto}</div>}
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button type="submit" className="btn btn-outline-primary" disabled={submitLoading}>
                                {submitLoading ? t('sending') : t('saveChanges')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};