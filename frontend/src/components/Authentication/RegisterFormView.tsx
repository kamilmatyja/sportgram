import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {GenderEnum} from '../../enums/GenderEnum';
import {CountryEnum} from '../../enums/CountryEnum';
import {RoleEnum} from '../../enums/RoleEnum';
import {RegisterBody} from '../../api/body/RegisterBody';

interface RegisterFormViewProps {
    formData: RegisterBody;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: Record<string, string | string[]>;
    globalError: string;
}

export const RegisterFormView: React.FC<RegisterFormViewProps> = ({
                                                                      formData,
                                                                      handleChange,
                                                                      onSubmit,
                                                                      loading,
                                                                      fieldErrors,
                                                                      globalError
                                                                  }) => {
    const {t} = useTranslation();

    const genderOptions = GenderEnum.getOptions(t);
    const countryOptions = CountryEnum.getOptions(t);
    const roleOptions = RoleEnum.getNanoOptions(t);

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4">{t('register')}</h2>
                            {globalError && <div className="alert alert-danger">{globalError}</div>}
                            <form onSubmit={onSubmit}>
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
                                <div className="mb-3">
                                    <label className="form-label">{t('email')}</label>
                                    <input type="email" name="email"
                                           className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                           value={formData.email || ''} onChange={handleChange} required/>
                                    {fieldErrors.email &&
                                        <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('password')}</label>
                                    <input type="password" name="password"
                                           className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                                           value={formData.password || ''} onChange={handleChange} required
                                           minLength={8}/>
                                    {fieldErrors.password &&
                                        <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t('phone')}</label>
                                        <input type="number" name="phone"
                                               className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                                               value={formData.phone || ''} onChange={handleChange} required/>
                                        {fieldErrors.phone &&
                                            <div className="invalid-feedback d-block">{fieldErrors.phone}</div>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t('birthAt')}</label>
                                        <input type="date" name="birthAt"
                                               className={`form-control ${fieldErrors.birthAt ? 'is-invalid' : ''}`}
                                               value={formData.birthAt || ''} onChange={handleChange} required/>
                                        {fieldErrors.birthAt &&
                                            <div className="invalid-feedback d-block">{fieldErrors.birthAt}</div>}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('gender')}</label>
                                    <select name="gender"
                                            className={`form-select ${fieldErrors.gender ? 'is-invalid' : ''}`}
                                            value={formData.gender || ''} onChange={handleChange} required>
                                        <option value="">{t('gender')}</option>
                                        {genderOptions.map((opt: any) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {fieldErrors.gender &&
                                        <div className="invalid-feedback d-block">{fieldErrors.gender}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('country')}</label>
                                    <select name="country"
                                            className={`form-select ${fieldErrors.country ? 'is-invalid' : ''}`}
                                            value={formData.country || ''} onChange={handleChange} required>
                                        <option value="">{t('country')}</option>
                                        {countryOptions.map((opt: any) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {fieldErrors.country &&
                                        <div className="invalid-feedback d-block">{fieldErrors.country}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('role')}</label>
                                    <select
                                        name="roles"
                                        className={`form-select ${fieldErrors.roles ? 'is-invalid' : ''}`}
                                        value={Array.isArray(formData.roles) ? formData.roles.map(String) : []}
                                        onChange={handleChange}
                                        required
                                        multiple
                                    >
                                        {roleOptions.map((opt: any) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {fieldErrors.roles &&
                                        <div className="invalid-feedback d-block">{fieldErrors.roles}</div>}
                                </div>
                                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                    {loading ? t('sending') : t('save')}
                                </button>
                            </form>
                            <div className="mt-3 text-center">
                                <a href="/sign" className="btn btn-link">{t('sign')}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};