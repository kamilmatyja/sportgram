import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {PushSubscriptionBody} from '../api/body/PushSubscriptionBody';
import {PushSubscriptionResponse} from '../api/responses/PushSubscriptionResponse';
import {PushSubscriptionStatusEnum} from '../enums/PushSubscriptionStatusEnum';
import {ColorEnum} from '../enums/ColorEnum';
import {UserResponse} from '../api/responses/UserResponse';

interface ManagePushSubscriptionModalProps {
    user: UserResponse | null;
    show: boolean;
    subscription: PushSubscriptionResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: PushSubscriptionBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManagePushSubscriptionModal: React.FC<ManagePushSubscriptionModalProps> = ({
                                                                                            user,
                                                                                            show,
                                                                                            subscription,
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
    if (!show || !subscription || !user) return null;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('manageSubscription')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                            <div className="mb-4">
                                <label className="form-label">{t('endpoint')}</label>
                                <span className="me-2 text-break">{subscription.endpoint}</span>
                            </div>

                            {isMyProfile && (
                                <form id="edit-push-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-3">
                                    <div className="mb-3">
                                        <label className="form-label">{t('browserDevice')}</label>
                                        <input type="text" name="userAgent"
                                               className={`form-control ${fieldErrors.userAgent ? 'is-invalid' : ''}`}
                                               value={formData.userAgent || ''} onChange={handleChange} required/>
                                        {fieldErrors.userAgent &&
                                            <div className="invalid-feedback d-block">{fieldErrors.userAgent}</div>}
                                    </div>
                                </form>
                            )}

                            {(isMyProfile || isAdmin) && (
                                <div className="mb-4 border-bottom pb-3">
                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                        <strong>{t('status')}:</strong>
                                        <span className="me-2 badge bg-light text-dark border profile-theme-border">
                                            {PushSubscriptionStatusEnum.getOptions(t).find(opt => String(opt.value) === String(subscription.status))?.label || subscription.status}
                                        </span>
                                        {PushSubscriptionStatusEnum.getOptions(t)
                                            .filter(opt => opt.value !== subscription.status)
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
                                    <button type="submit" form="edit-push-form" className="btn btn-profile-primary"
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