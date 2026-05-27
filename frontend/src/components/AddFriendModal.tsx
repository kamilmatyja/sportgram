import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { FriendBody } from '../api/body/FriendBody';
import { ColorEnum } from '../enums/ColorEnum';
import { UserResponse } from '../api/responses/UserResponse';

interface AddFriendModalProps {
    user: UserResponse | null;
    show: boolean;
    availableUsers: UserResponse[];
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: FriendBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
                                                                  user, show, availableUsers, closeModal, loading, globalError, fieldErrors, formData, handleChange, handleSubmit
                                                              }) => {
    const { t } = useTranslation();
    if (!show || !user) return null;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <>
            <div className={`modal d-block ${themeClass}`} tabIndex={-1}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{t('addFriend')}</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {globalError && <div className="alert alert-danger">{t(globalError)}</div>}
                                <div className="mb-3">
                                    <label className="form-label">{t('user')}</label>
                                    <select
                                        name="receiverUserId"
                                        className={`form-select ${fieldErrors.receiverUserId ? 'is-invalid' : ''}`}
                                        value={formData.receiverUserId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">{t('selectUser')}</option>
                                        {availableUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.firstName} {u.lastName} ({u.link})
                                            </option>
                                        ))}
                                    </select>
                                    {fieldErrors.receiverUserId && <div className="invalid-feedback d-block">{fieldErrors.receiverUserId}</div>}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-profile-primary" disabled={loading || availableUsers.length === 0}>
                                    {loading ? t('sending') : t('addFriend')}
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