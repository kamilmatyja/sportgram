import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {GoalBody} from '../api/body/GoalBody';
import {GoalResponse} from '../api/responses/GoalResponse';
import {GoalStatusEnum} from '../enums/GoalStatusEnum';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {UserResponse} from '../api/responses/UserResponse';
import {ColorEnum} from '../enums/ColorEnum';

interface ManageGoalModalProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    availableUsers: UserResponse[];
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    show: boolean;
    goal: GoalResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    closeModal: () => void;
    loading: boolean;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    formData: GoalBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleParticipantStatusSubmit: (participantId: string, newStatus: number) => void;
    handleParticipantResultStatusSubmit: (resultId: string, newStatus: number) => void;
    handleDelete: () => void;
}

export const ManageGoalModal: React.FC<ManageGoalModalProps> = ({
                                                                    user,
                                                                    currentUser,
                                                                    availableUsers,
                                                                    handleParticipantsChange,
                                                                    show,
                                                                    goal,
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
                                                                    handleParticipantResultStatusSubmit,
                                                                    handleDelete
                                                                }) => {
    const {t} = useTranslation();
    if (!show || !goal || !user || !currentUser) return null;

    const hexColor = ColorEnum.getHex(user.color);

    const myParticipant = goal.participants?.find(p => p.userId === currentUser.id);

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('manageGoal')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            {globalError && <div className="alert alert-danger">{t(globalError)}</div>}

                            {isMyProfile && (
                                <form id="edit-goal-form" onSubmit={handleEditSubmit}
                                      className="mb-4 border-bottom">
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label">{t('startedAt')}</label>
                                            <input type="datetime-local" name="startedAt"
                                                   className={`form-control ${fieldErrors.startedAt ? 'is-invalid' : ''}`}
                                                   value={formData.startedAt || ''} onChange={handleChange}/>
                                            {fieldErrors.startedAt &&
                                                <div className="invalid-feedback d-block">{fieldErrors.startedAt}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">{t('endedAt')}</label>
                                            <input type="datetime-local" name="endedAt"
                                                   className={`form-control ${fieldErrors.endedAt ? 'is-invalid' : ''}`}
                                                   value={formData.endedAt || ''} onChange={handleChange}/>
                                            {fieldErrors.endedAt &&
                                                <div className="invalid-feedback d-block">{fieldErrors.endedAt}</div>}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{t('title')}</label>
                                        <input type="text" name="text"
                                               className={`form-control ${fieldErrors.text ? 'is-invalid' : ''}`}
                                               value={formData.text} onChange={handleChange} required/>
                                        {fieldErrors.text &&
                                            <div className="invalid-feedback d-block">{fieldErrors.text}</div>}
                                    </div>

                                    <div className="row mb-3">
                                        <div className="col-md-4">
                                            <label className="form-label">{t('link')}</label>
                                            <input type="text" name="link"
                                                   className={`form-control ${fieldErrors.link ? 'is-invalid' : ''}`}
                                                   value={formData.link} onChange={handleChange} required/>
                                            {fieldErrors.link &&
                                                <div className="invalid-feedback d-block">{fieldErrors.link}</div>}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">{t('discipline')}</label>
                                            <select name="discipline"
                                                    className={`form-select ${fieldErrors.discipline ? 'is-invalid' : ''}`}
                                                    value={formData.discipline || ''} onChange={handleChange} required>
                                                <option value="">{t('selectOption')}</option>
                                                {DisciplineEnum.getOptions(t).map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            {fieldErrors.discipline && <div
                                                className="invalid-feedback d-block">{fieldErrors.discipline}</div>}
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">{t('distance')} [m]</label>
                                            <input type="number" name="distance"
                                                   className={`form-control ${fieldErrors.distance ? 'is-invalid' : ''}`}
                                                   value={formData.distance || ''} onChange={handleChange} required/>
                                            {fieldErrors.distance &&
                                                <div className="invalid-feedback d-block">{fieldErrors.distance}</div>}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">{t('time')} [s]</label>
                                        <input type="number" name="time"
                                               className={`form-control ${fieldErrors.time ? 'is-invalid' : ''}`}
                                               value={formData.time || ''} onChange={handleChange}/>
                                        {fieldErrors.time &&
                                            <div className="invalid-feedback d-block">{fieldErrors.time}</div>}
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
                                        <strong>{t('goalStatus')}:</strong>
                                        <span className="me-2">
                                            {GoalStatusEnum.getOptions(t).find(opt => String(opt.value) === String(goal.status))?.label || goal.status}
                                        </span>
                                        {GoalStatusEnum.getOptions(t)
                                            .filter(opt => opt.value !== goal.status)
                                            .filter(opt => isAdmin || (isMyProfile && opt.value !== GoalStatusEnum.REJECTED))
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
                                <>
                                    <div className="mb-4 border-bottom pb-3">
                                        <div className="d-flex flex-wrap gap-2 align-items-center">
                                            <strong>{t('participantStatus')}:</strong>
                                            <span className="me-2">
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
                                    {myParticipant.results && myParticipant.results.length > 0 && myParticipant.results.map(res => (
                                        <div key={res.id}
                                             className="d-flex flex-wrap gap-2 align-items-center mb-2 border p-2 rounded">
                                            <div>
                                                <strong>{t('distance')}:</strong> {res.distance} [m]
                                                | <strong>{t('time')}:</strong> {res.time} [s]
                                                | <strong>{t('status')}:</strong> {SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(res.status))?.label || res.status}
                                            </div>
                                            <div className="ms-auto">
                                                {SaveStatusEnum.getOptions(t)
                                                    .filter(opt => opt.value !== res.status)
                                                    .filter(opt => opt.value !== SaveStatusEnum.PENDING)
                                                    .map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2 ms-1"
                                                            disabled={loading}
                                                            onClick={() => handleParticipantResultStatusSubmit(res.id, opt.value)}
                                                        >
                                                            {loading ? t('loading') : opt.label}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </>
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
                                    <button type="submit" form="edit-goal-form" className="btn btn-profile-primary"
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