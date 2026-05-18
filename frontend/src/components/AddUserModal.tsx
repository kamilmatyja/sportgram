import React, {useState} from 'react';
import {useTranslation} from '../context/TranslationContext';
import {UserCreateDto} from '../api/dto/UserCreateDto';
import {GenderEnum} from '../enums/GenderEnum';
import {CountryEnum} from '../enums/CountryEnum';
import {RoleEnum} from '../enums/RoleEnum';
import {FileUtil} from '../utils/FileUtil';

interface AddUserModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (dto: UserCreateDto) => Promise<void>;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({show, onClose, onSubmit}) => {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '',
        phone: '', birthAt: '', link: '', bio: '',
        gender: 1, country: 35, language: 1, theme: 1, color: 1
    });

    const [profilePhotoStr, setProfilePhotoStr] = useState<string>('');
    const [backgroundPhotoStr, setBackgroundPhotoStr] = useState<string>('');

    if (!show) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64String = await FileUtil.fileToBase64(file);
            setter(base64String);
        } else {
            setter('');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        if (!profilePhotoStr || !backgroundPhotoStr) {
            setGlobalError(t('photosRequired'));
            setLoading(false);
            return;
        }

        const dto = new UserCreateDto(
            formData.birthAt,
            formData.firstName,
            formData.lastName,
            Number(formData.gender),
            Number(formData.phone),
            formData.email,
            formData.password,
            formData.link,
            Number(formData.language),
            Number(formData.country),
            Number(formData.theme),
            Number(formData.color),
            profilePhotoStr,
            backgroundPhotoStr,
            formData.bio,
            [RoleEnum.ADMINISTRATOR]
        );

        try {
            await onSubmit(dto);
            onClose();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{t('addUser')}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{globalError}</div>}

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('firstName')}</label>
                                    <input name="firstName"
                                           className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`}
                                           value={formData.firstName} onChange={handleChange} required/>
                                    {fieldErrors.firstName &&
                                        <div className="invalid-feedback d-block">{fieldErrors.firstName}</div>}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('lastName')}</label>
                                    <input name="lastName"
                                           className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`}
                                           value={formData.lastName} onChange={handleChange} required/>
                                    {fieldErrors.lastName &&
                                        <div className="invalid-feedback d-block">{fieldErrors.lastName}</div>}
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('email')}</label>
                                    <input type="email" name="email"
                                           className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                           value={formData.email} onChange={handleChange} required/>
                                    {fieldErrors.email &&
                                        <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('password')}</label>
                                    <input type="password" name="password"
                                           className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                                           value={formData.password} onChange={handleChange} required minLength={8}/>
                                    {fieldErrors.password &&
                                        <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">{t('phone')}</label>
                                    <input type="number" name="phone"
                                           className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                                           value={formData.phone} onChange={handleChange} required/>
                                    {fieldErrors.phone &&
                                        <div className="invalid-feedback d-block">{fieldErrors.phone}</div>}
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">{t('birthAt')}</label>
                                    <input type="date" name="birthAt"
                                           className={`form-control ${fieldErrors.birthAt ? 'is-invalid' : ''}`}
                                           value={formData.birthAt} onChange={handleChange} required/>
                                    {fieldErrors.birthAt &&
                                        <div className="invalid-feedback d-block">{fieldErrors.birthAt}</div>}
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">{t('link')}</label>
                                    <input type="text" name="link"
                                           className={`form-control ${fieldErrors.link ? 'is-invalid' : ''}`}
                                           value={formData.link} onChange={handleChange} required/>
                                    {fieldErrors.link &&
                                        <div className="invalid-feedback d-block">{fieldErrors.link}</div>}
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('gender')}</label>
                                    <select name="gender" className="form-select" value={formData.gender}
                                            onChange={handleChange} required>
                                        {GenderEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                                     value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('country')}</label>
                                    <select name="country" className="form-select" value={formData.country}
                                            onChange={handleChange} required>
                                        {CountryEnum.getOptions(t).map(opt => <option key={opt.value}
                                                                                      value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('bio')}</label>
                                <textarea name="bio" className={`form-control ${fieldErrors.bio ? 'is-invalid' : ''}`}
                                          value={formData.bio} onChange={handleChange} required/>
                                {fieldErrors.bio && <div className="invalid-feedback d-block">{fieldErrors.bio}</div>}
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('profilePhoto')}</label>
                                    <input type="file" accept="image/*" className="form-control"
                                           onChange={(e) => handleFileChange(e, setProfilePhotoStr)} required/>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">{t('backgroundPhoto')}</label>
                                    <input type="file" accept="image/*" className="form-control"
                                           onChange={(e) => handleFileChange(e, setBackgroundPhotoStr)} required/>
                                </div>
                            </div>

                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
                            <button type="submit" className="btn btn-success" disabled={loading}>
                                {loading ? t('sending') : t('addUser')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};