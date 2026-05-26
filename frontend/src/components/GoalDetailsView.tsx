import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {GoalResponse} from '../api/responses/GoalResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {GoalBody} from '../api/body/GoalBody';
import {ColorEnum} from '../enums/ColorEnum';
import {GoalStatusEnum} from '../enums/GoalStatusEnum';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {formatDate} from '../utils/dateFormat';

interface GoalDetailsViewProps {
    goal: GoalResponse | null;
    ownerUser: UserResponse | null;
    currentUser: UserResponse | null;
    availableUsers: UserResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    submitLoading: boolean;
    error: string | null;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    successMsg: string;
    formData: GoalBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleParticipantStatusSubmit: (participantId: string, newStatus: number) => void;
    handleParticipantResultStatusSubmit: (resultId: string, newStatus: number) => void;
    handleDelete: () => void;
}

export const GoalDetailsView: React.FC<GoalDetailsViewProps> = ({
                                                                    goal,
                                                                    ownerUser,
                                                                    currentUser,
                                                                    availableUsers,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    loading,
                                                                    submitLoading,
                                                                    error,
                                                                    globalError,
                                                                    fieldErrors,
                                                                    successMsg,
                                                                    formData,
                                                                    handleChange,
                                                                    handleParticipantsChange,
                                                                    handleEditSubmit,
                                                                    handleStatusSubmit,
                                                                    handleParticipantStatusSubmit,
                                                                    handleParticipantResultStatusSubmit,
                                                                    handleDelete
                                                                }) => {
    const {t} = useTranslation();

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border"/>
    </div>;

    if (error || !goal || !ownerUser || !currentUser) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const hexColor = ColorEnum.getHex(ownerUser.color);
    const myParticipant = goal.participants?.find(p => p.userId === currentUser.id);

    return (
        <div className="container mt-4 mb-5" style={{'--theme-color': hexColor} as React.CSSProperties}>
            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                <a href={`/users/${ownerUser.link}/goals`} className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('goals')}
                </a>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <h4 className="mb-4">{t('goalDetails')}</h4>

                    {globalError && <div className="alert alert-danger">{t(globalError)}</div>}
                    {successMsg && <div className="alert alert-success">{t(successMsg)}</div>}

                    {isMyProfile ? (
                        <form id="edit-goal-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
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

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="btn btn-danger" onClick={handleDelete}
                                        disabled={submitLoading}>
                                    {submitLoading ? t('sending') : t('delete')}
                                </button>
                                <button type="submit" className="btn btn-profile-primary"
                                        disabled={submitLoading}>
                                    {submitLoading ? t('sending') : t('saveChanges')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-4 border-bottom pb-4">
                            <h5>{goal.text}</h5>
                            <p className="text-muted">
                                {DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(goal.discipline))?.label || goal.discipline}
                                <span className="mx-2">|</span>
                                {goal.distance} [m]
                                {goal.time ? <><span className="mx-2">|</span> {goal.time} [s]</> : ''}
                            </p>
                            {(goal.startedAt || goal.endedAt) && (
                                <p className="text-muted mb-0">
                                    {goal.startedAt && <>
                                        <span>{t('from')}: {formatDate(goal.startedAt)}</span>
                                    </>}
                                    {goal.endedAt && <>
                                        <span className="mx-2">{t('to')}:</span> <span>{formatDate(goal.endedAt)}</span>
                                    </>}
                                </p>
                            )}
                        </div>
                    )}

                    {(isMyProfile || isAdmin) && (
                        <div className="mb-4 border-bottom pb-4">
                            <h6 className="mb-3">{t('manageGoalStatus')}</h6>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <strong>{t('goalStatus')}:</strong>
                                <span className="me-2 badge bg-light text-dark border profile-theme-border">
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
                                            disabled={submitLoading}
                                            onClick={() => handleStatusSubmit(opt.value)}
                                        >
                                            {submitLoading ? t('loading') : opt.label}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}

                    {myParticipant && (
                        <>
                            <div className="mb-4 border-bottom pb-4">
                                <h6 className="mb-3">{t('manageParticipantStatus')}</h6>
                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                    <strong>{t('participantStatus')}:</strong>
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
                                                disabled={submitLoading}
                                                onClick={() => handleParticipantStatusSubmit(myParticipant.id, opt.value)}
                                            >
                                                {submitLoading ? t('loading') : opt.label}
                                            </button>
                                        ))}
                                </div>
                            </div>
                            <div className="mb-4">
                                {myParticipant.results && myParticipant.results.length > 0 && (
                                    <div>
                                        <strong className="d-block mb-2">{t('manageResultStatus')}:</strong>
                                        {myParticipant.results.map(res => (
                                            <div key={res.id}
                                                 className="d-flex flex-wrap gap-2 align-items-center mb-2 border p-2 rounded bg-light">
                                                <div>
                                                    <strong>{t('distance')}:</strong> {res.distance} [m]
                                                    <span className="mx-2">|</span>
                                                    <strong>{t('time')}:</strong> {res.time} [s]
                                                    <span className="mx-2">|</span>
                                                    <strong>{t('status')}:</strong> {SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(res.status))?.label || res.status}
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
                                                                disabled={submitLoading}
                                                                onClick={() => handleParticipantResultStatusSubmit(res.id, opt.value)}
                                                            >
                                                                {submitLoading ? t('loading') : opt.label}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};