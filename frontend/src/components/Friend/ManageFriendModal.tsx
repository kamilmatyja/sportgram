import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';
import {ColorEnum} from '../../enums/ColorEnum';

interface ManageFriendModalProps {
    user: UserResponse | null;
    show: boolean;
    friend: FriendResponse | null;
    isMyProfile: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    handleStatusSubmit: (newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageFriendModal: React.FC<ManageFriendModalProps> = ({
                                                                        user,
                                                                        show,
                                                                        friend,
                                                                        isMyProfile,
                                                                        closeModal,
                                                                        loading,
                                                                        globalError,
                                                                        handleStatusSubmit,
                                                                        handleDelete
                                                                    }) => {
    const {t} = useTranslation();
    if (!show || !friend || !user) return null;

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
                                <span className="me-2 badge bg-light text-dark border profile-theme-border">
                                    {FriendStatusEnum.getOptions(t).find(opt => String(opt.value) === String(friend.status))?.label || friend.status}
                                </span>
                                {FriendStatusEnum.getOptions(t)
                                    .filter(opt => opt.value !== friend.status)
                                    .filter(opt => opt.value !== FriendStatusEnum.PENDING)
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
                            {isMyProfile && (
                                <button type="button" className="btn btn-danger" onClick={handleDelete}
                                        disabled={loading}>
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