import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {FeedBody} from '../api/body/FeedBody';
import {FeedResponse} from '../api/responses/FeedResponse';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {StatusBody} from '../api/body/StatusBody';
import {UserResponse} from "../api/responses/UserResponse.ts";
import {ColorEnum} from "../enums/ColorEnum.ts";

interface ManageFeedModalProps {
    user: UserResponse | null;
    show: boolean;
    feed: FeedResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: FeedBody;
    statusData: StatusBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleDelete: () => void;
}

export const ManageFeedModal: React.FC<ManageFeedModalProps> = ({
                                                                    user,
                                                                    show,
                                                                    feed,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    closeModal,
                                                                    loading,
                                                                    globalError,
                                                                    fieldErrors,
                                                                    formData,
                                                                    statusData,
                                                                    handleChange,
                                                                    handleStatusChange,
                                                                    handleEditSubmit,
                                                                    handleStatusSubmit,
                                                                    handleDelete
                                                                }) => {
    const {t} = useTranslation();
    if (!show || !feed || !user) return null;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('manageFeed')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                            {isMyProfile && (
                                <form onSubmit={handleEditSubmit} className="mb-4 pb-4 border-bottom">
                                    <div className="mb-3">
                                        <label className="form-label">{t('text')}</label>
                                        <textarea name="text"
                                                  className={`form-control ${fieldErrors.text ? 'is-invalid' : ''}`}
                                                  value={formData.text} onChange={handleChange} required rows={3}/>
                                        {fieldErrors.text &&
                                            <div className="invalid-feedback d-block">{fieldErrors.text}</div>}
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
                                    <button type="submit" className="btn btn-profile-primary"
                                            disabled={loading}>{loading ? t('sending') : t('saveChanges')}</button>
                                </form>
                            )}

                            {(isMyProfile || isAdmin) && (
                                <form onSubmit={handleStatusSubmit} className="mb-4 pb-4 border-bottom">
                                    <h6>{t('changeStatus')}</h6>
                                    <div className="d-flex gap-2 align-items-center">
                                        <select className="form-select w-auto" value={statusData.status || ''}
                                                onChange={handleStatusChange} required>
                                            {ElementStatusEnum.getOptions(t).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <button type="submit" className="btn btn-warning"
                                                disabled={loading}>{loading ? t('sending') : t('changeStatus')}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary"
                                    onClick={closeModal}>{t('cancel')}</button>
                            {isMyProfile && (
                                <button type="button" className="btn btn-danger" onClick={handleDelete}
                                        disabled={loading}>{loading ? t('sending') : t('delete')}</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};