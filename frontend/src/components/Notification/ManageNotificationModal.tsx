import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {NotificationResponse} from '../../api/responses/NotificationResponse';
import {NotificationStatusEnum} from '../../enums/NotificationStatusEnum';
import {UserResponse} from '../../api/responses/UserResponse';
import {ColorEnum} from '../../enums/ColorEnum';

interface ManageNotificationModalProps {
    user: UserResponse | null;
    show: boolean;
    notification: NotificationResponse | null;
    isMyProfile: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageNotificationModal: React.FC<ManageNotificationModalProps> = ({
                                                                                    user,
                                                                                    show,
                                                                                    notification,
                                                                                    isMyProfile,
                                                                                    closeModal,
                                                                                    loading,
                                                                                    globalError,
                                                                                    handleStatusSubmit,
                                                                                    handleDelete
                                                                                }) => {
    const {t} = useTranslation();
    if (!show || !notification || !user || !isMyProfile) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <>
            <div className={`modal d-block ${themeClass}`} tabIndex={-1}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('manage')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <strong>{t('status')}: </strong>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {NotificationStatusEnum.getOptions(t).find(opt => String(opt.value) === String(notification.status))?.label || notification.status}
                                </span>
                                {NotificationStatusEnum.getOptions(t)
                                    .filter(opt => opt.value !== notification.status)
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
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
                                {t('cancel')}
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                                {loading ? t('sending') : t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};