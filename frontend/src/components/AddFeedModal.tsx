import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {FeedBody} from '../api/body/FeedBody';

interface AddFeedModalProps {
    show: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: FeedBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddFeedModal: React.FC<AddFeedModalProps> = ({
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
    if (!show) return null;

    return (
        <>
            <div className="modal d-block" tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{t('addFeed')}</h5>
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
                                <button type="button" className="btn btn-secondary"
                                        onClick={closeModal}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-profile-primary"
                                        disabled={loading}>{loading ? t('sending') : t('saveChanges')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};