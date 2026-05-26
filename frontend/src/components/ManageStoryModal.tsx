import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {StoryBody} from '../api/body/StoryBody';
import {StoryResponse} from '../api/responses/StoryResponse';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {UserResponse} from '../api/responses/UserResponse';
import {ColorEnum} from '../enums/ColorEnum';

interface ManageStoryModalProps {
    user: UserResponse | null;
    show: boolean;
    story: StoryResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: StoryBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageStoryModal: React.FC<ManageStoryModalProps> = ({
                                                                      user,
                                                                      show,
                                                                      story,
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
    if (!show || !story || !user) return null;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('manageStory')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                            {isMyProfile && (
                                <form id="edit-story-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom">
                                    <div className="mb-3">
                                        <label className="form-label">{t('text')}</label>
                                        <textarea name="text"
                                                  className={`form-control ${fieldErrors.text ? 'is-invalid' : ''}`}
                                                  value={formData.text || ''} onChange={handleChange} required
                                                  rows={3}/>
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
                                </form>
                            )}

                            {(isMyProfile || isAdmin) && (
                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                    <strong>{t('status')}: </strong>
                                    <span className="me-2 badge bg-light text-dark border profile-theme-border">
                                            {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(story.status))?.label || story.status}
                                    </span>
                                    {ElementStatusEnum.getOptions(t)
                                        .filter(opt => opt.value !== story.status)
                                        .filter(opt => isAdmin || (isMyProfile && opt.value !== ElementStatusEnum.REJECTED))
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
                                    <button type="submit" form="edit-story-form" className="btn btn-profile-primary"
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