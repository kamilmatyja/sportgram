import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {GoalResponse} from '../api/responses/GoalResponse';
import {GoalStatusEnum} from '../enums/GoalStatusEnum';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {UserResponse} from '../api/responses/UserResponse';
import {ColorEnum} from '../enums/ColorEnum';
import {formatDate} from '../utils/dateFormat';

interface DetailsGoalModalProps {
    relatedUsers: Record<string, UserResponse>;
    user: UserResponse | null;
    show: boolean;
    goal: GoalResponse | null;
    closeModal: () => void;
}

export const DetailsGoalModal: React.FC<DetailsGoalModalProps> = ({
                                                                      relatedUsers,
                                                                      user,
                                                                      show,
                                                                      goal,
                                                                      closeModal
                                                                  }) => {
    const {t} = useTranslation();
    if (!show || !goal || !user) return null;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('goalDetails')}</h5>
                            <button type="button" className="btn-close" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            <div className="row mb-3">
                                <div className="col-md-6"><p><strong>{t('startedAt')}:</strong> {formatDate(goal.startedAt)}</p></div>
                                <div className="col-md-6"><p><strong>{t('endedAt')}:</strong> {formatDate(goal.endedAt)}</p></div>
                            </div>
                            <p><strong>{t('title')}:</strong> {goal.text}</p>
                            <p><strong>{t('link')}:</strong> {goal.link}</p>
                            <div className="row mb-3">
                                <div className="col-md-4"><p><strong>{t('discipline')}:</strong> {DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(goal.discipline))?.label || goal.discipline}</p></div>
                                <div className="col-md-4"><p><strong>{t('distance')}:</strong> {goal.distance} [m]</p></div>
                                <div className="col-md-4"><p><strong>{t('time')}:</strong> {goal.time ? goal.time : '-'} [s]</p></div>
                            </div>
                            <p><strong>{t('status')}:</strong> {GoalStatusEnum.getOptions(t).find(opt => String(opt.value) === String(goal.status))?.label || goal.status}</p>

                            <h6 className="mt-4 border-bottom pb-2">{t('participants')}</h6>
                            {(!goal.participants || goal.participants.length === 0) ? (
                                <p className="text-muted">{t('noParticipants')}</p>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {goal.participants.map(p => {
                                        const participantUser = relatedUsers[p.userId];
                                        const userLabel = participantUser ? `${participantUser.firstName} ${participantUser.lastName} (@${participantUser.link})` : p.userId;

                                        return (
                                            <li key={p.id} className="list-group-item">
                                                <div><strong>{t('user')}:</strong> {userLabel} | <strong>{t('status')}:</strong> {SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(p.status))?.label || p.status}</div>
                                                {p.results && p.results.length > 0 && (
                                                    <ul className="mt-2 text-muted small">
                                                        {p.results.map(r => (
                                                            <li key={r.id}>
                                                                {t('distance')}: {r.distance} [m], {t('time')}: {r.time} [s], {t('status')}: {SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(r.status))?.label || r.status}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeModal}>{t('close')}</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};