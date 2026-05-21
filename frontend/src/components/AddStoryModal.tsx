import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {StoryBody} from '../api/body/StoryBody';
import {ColorEnum} from "../enums/ColorEnum";
import {UserResponse} from "../api/responses/UserResponse";

interface AddStoryModalProps {
    user: UserResponse | null;
    show: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: StoryBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddStoryModal: React.FC<AddStoryModalProps> = ({
                                                                user,
                                                                show,
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
                                <h5 className="modal-title">{t('addStory')}</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {globalError && <div className="alert alert-danger">{t(globalError)}</div>}
                                <div className="mb-3">
                                    <label className="form-label">{t('text')}</label>
                                    <textarea name="text"
                                              className={`form-control ${fieldErrors.text ? 'is-invalid' : ''}`}
                                              value={formData.text} onChange={handleChange} required rows={4}/>
                                    {fieldErrors.text &&
                                        <div className="invalid-feedback d-block">{fieldErrors.text}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('photo')}</label>
                                    <input type="file" accept="image/*" name="photo"
                                           className={`form-control ${fieldErrors.photo ? 'is-invalid' : ''}`}
                                           onChange={handleChange} required/>
                                    {fieldErrors.photo &&
                                        <div className="invalid-feedback d-block">{fieldErrors.photo}</div>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-profile-primary" disabled={loading}>
                                    {loading ? t('sending') : t('addStory')}
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