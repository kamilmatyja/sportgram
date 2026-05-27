import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {ColorEnum} from '../enums/ColorEnum';
import {UserResponse} from '../api/responses/UserResponse';

interface AddPushSubscriptionModalProps {
    user: UserResponse | null;
    show: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    handleSubscribeDevice: () => void;
}

export const AddPushSubscriptionModal: React.FC<AddPushSubscriptionModalProps> = ({
                                                                                      user,
                                                                                      show,
                                                                                      closeModal,
                                                                                      loading,
                                                                                      globalError,
                                                                                      handleSubscribeDevice
                                                                                  }) => {
    const {t} = useTranslation();
    if (!show || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <>
            <div className={`modal d-block ${themeClass}`} tabIndex={-1}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('addSubscription')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}
                            <p>{t('pushSubscriptionInfo')}</p>
                            <p className="text-muted small">{t('pushPermissionWillBeAsked')}</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary"
                                    onClick={closeModal}>{t('cancel')}</button>
                            <button type="button" className="btn btn-profile-primary" onClick={handleSubscribeDevice}
                                    disabled={loading}>
                                {loading ? t('sending') : t('subscribeThisDevice')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};