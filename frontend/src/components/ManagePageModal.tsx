import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {PageBody} from '../api/body/PageBody';
import {PageResponse} from '../api/responses/PageResponse';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {PageFollowStatusEnum} from '../enums/PageFollowStatusEnum';
import {ColorEnum} from '../enums/ColorEnum';
import {UserResponse} from '../api/responses/UserResponse';

interface ManagePageModalProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    availableUsers: UserResponse[];
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    show: boolean;
    currentPageObj: PageResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: PageBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleParticipantStatusSubmit: (participantId: string, newStatus: number) => void;
    handleFollowStatusSubmit: (followId: string, newStatus: number) => void;
    handleDelete: () => void;
}

export const ManagePageModal: React.FC<ManagePageModalProps> = ({
                                                                    user,
                                                                    currentUser,
                                                                    availableUsers,
                                                                    handleParticipantsChange,
                                                                    show,
                                                                    currentPageObj,
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
                                                                    handleParticipantStatusSubmit,
                                                                    handleFollowStatusSubmit,
                                                                    handleDelete
                                                                }) => {
    const {t} = useTranslation();
    if (!show || !currentPageObj || !user || !currentUser) return null;

    const hexColor = ColorEnum.getHex(user.color);

    const myParticipant = currentPageObj.participants?.find(p => p.userId === currentUser.id);

    const visibleFollows = currentPageObj.follows
        ? (isAdmin ? currentPageObj.follows : currentPageObj.follows.filter(f => f.userId === currentUser.id))
        : [];

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('managePage')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                            {isMyProfile && (
                                <form id="edit-page-form" onSubmit={handleEditSubmit}
                                      className="mb-4 border-bottom pb-3">
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
                                            {fieldErrors.color && <div
                                                className="invalid-feedback d-block">{fieldErrors.color}</div>}
                                        </div>
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">{t('profilePhoto')}</label>
                                            <input type="file" accept="image/*" name="profilePhoto"
                                                   className={`form-control ${fieldErrors.profilePhoto ? 'is-invalid' : ''}`}
                                                   onChange={handleChange}/>
                                            <div className="form-text">{t('photoOptional')}</div>
                                            {fieldErrors.profilePhoto && <div className="invalid-feedback d-block">{fieldErrors.profilePhoto}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('backgroundPhoto')}</label>
                                            <input type="file" accept="image/*" name="backgroundPhoto"
                                                   className={`form-control ${fieldErrors.backgroundPhoto ? 'is-invalid' : ''}`}
                                                   onChange={handleChange}/>
                                            <div className="form-text">{t('photoOptional')}</div>
                                            {fieldErrors.backgroundPhoto && <div className="invalid-feedback d-block">{fieldErrors.backgroundPhoto}</div>}
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
                                </form>
                            )}

                            {(isMyProfile || isAdmin) && (
                                <div className="mb-4 border-bottom pb-3">
                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                        <strong>{t('pageStatus')}: </strong>
                                        <span className="me-2 badge bg-light text-dark border profile-theme-border">
                                            {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(currentPageObj.status))?.label || currentPageObj.status}
                                        </span>
                                        {ElementStatusEnum.getOptions(t)
                                            .filter(opt => opt.value !== currentPageObj.status)
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
                                </div>
                            )}

                            {myParticipant && (
                                <div className="mb-4 border-bottom pb-3">
                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                        <strong>{t('participantStatus')}: </strong>
                                        <span className="me-2 badge bg-light text-dark border profile-theme-border">
                                            {SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(myParticipant.status))?.label || myParticipant.status}
                                        </span>
                                        {SaveStatusEnum.getOptions(t)
                                            .filter(opt => opt.value !== myParticipant.status)
                                            .filter(opt => opt.value !== SaveStatusEnum.PENDING)
                                            .map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                                    disabled={loading}
                                                    onClick={() => handleParticipantStatusSubmit(myParticipant.id, opt.value)}
                                                >
                                                    {loading ? t('loading') : opt.label}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {visibleFollows.length > 0 && (
                                <div className="mb-4">
                                    <h6>{t('pageFollows')} ({visibleFollows.length})</h6>
                                    {visibleFollows.map(follow => (
                                        <div key={follow.id} className="d-flex flex-wrap gap-2 align-items-center mb-2 border p-2 rounded">
                                            <div>
                                                <strong>{isAdmin ? `${t('user')}: ${follow.userId} | ` : ''}{t('status')}: </strong>
                                                <span className="me-2 badge bg-light text-dark border profile-theme-border">{PageFollowStatusEnum.getOptions(t).find(opt => String(opt.value) === String(follow.status))?.label || follow.status}
                                                </span>
                                            </div>
                                            <div className="ms-auto d-flex gap-1 flex-wrap">
                                                {PageFollowStatusEnum.getOptions(t)
                                                    .filter(opt => opt.value !== follow.status)
                                                    .filter(opt => opt.value !== PageFollowStatusEnum.PENDING)
                                                    .map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                                            disabled={loading}
                                                            onClick={() => handleFollowStatusSubmit(follow.id, opt.value)}
                                                        >
                                                            {loading ? t('loading') : opt.label}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
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
                                    <button type="submit" form="edit-page-form" className="btn btn-profile-primary"
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