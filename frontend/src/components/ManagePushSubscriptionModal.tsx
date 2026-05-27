import React from 'react';
import {useTranslation} from '../context/TranslationContext';
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
                                                                                            handleStatusSubmit,
                                                                                            handleDelete
                                                                                        }) => {
    const {t} = useTranslation();
    if (!show || !subscription || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <>
            <div className={`modal d-block ${themeClass}`} tabIndex={-1}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('manageSubscription')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                            {(isMyProfile || isAdmin) && (
                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                    <strong>{t('status')}: </strong>
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
                            )}

                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
                                {t('cancel')}
                            </button>
                            {isMyProfile && (
                                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                                    {loading ? t('sending') : t('delete')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};