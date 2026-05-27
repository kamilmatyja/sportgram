import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {GoalParticipantResponse} from '../../api/responses/GoalParticipantResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {SaveStatusEnum} from '../../enums/SaveStatusEnum';

interface GoalParticipantsTableProps {
    participants: GoalParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateParticipantStatus: (participantId: string, status: number) => void;
    onUpdateResultStatus: (resultId: string, status: number) => void;
}

export const GoalParticipantsTable: React.FC<GoalParticipantsTableProps> = ({
                                                                                participants,
                                                                                relatedUsers,
                                                                                currentUser,
                                                                                actionLoading,
                                                                                onUpdateParticipantStatus,
                                                                                onUpdateResultStatus
                                                                            }) => {
    const {t} = useTranslation();

    if (!participants || participants.length === 0) {
        return <div className="text-muted small p-2">{t('noParticipants')}</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-borderless align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('user')}</th>
                    <th>{t('participantStatus')}</th>
                    <th>{t('manage')}</th>
                </tr>
                </thead>
                <tbody>
                {participants.map(p => {
                    const u = relatedUsers[p.userId];
                    const isOwner = currentUser?.id === p.userId;

                    return (
                        <React.Fragment key={p.id}>
                            <tr>
                                <td>
                                    {u ? (
                                        <a href={`/users/${u.link}`} className="text-decoration-none">
                                            {u.firstName} {u.lastName}
                                        </a>
                                    ) : p.userId}
                                </td>
                                <td>
                                    <span className="badge bg-light text-dark border profile-theme-border">
                                        {SaveStatusEnum.getOptions(t).find(opt => opt.value === p.status)?.label || p.status}
                                    </span>
                                </td>
                                <td>
                                    {isOwner && SaveStatusEnum.getOptions(t)
                                        .filter(opt => opt.value !== p.status && opt.value !== SaveStatusEnum.PENDING)
                                        .map(opt => (
                                            <button
                                                key={opt.value}
                                                className="btn btn-xs btn-profile-outline-primary py-0 px-2 me-1"
                                                disabled={actionLoading === p.id}
                                                onClick={() => onUpdateParticipantStatus(p.id, opt.value)}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                </td>
                            </tr>
                            {p.results && p.results.length > 0 && p.results.map(r => (
                                <tr key={r.id} className="bg-light border-bottom">
                                    <td className="text-end text-muted small pe-3">
                                        <i className="bi bi-arrow-return-right me-1"></i>
                                        {t('results')}:
                                    </td>
                                    <td colSpan={2}>
                                        <div className="d-flex align-items-center gap-3">
                                            <span
                                                className="small"><strong>{t('distance')}:</strong> {r.distance}m</span>
                                            <span className="small"><strong>{t('time')}:</strong> {r.time}s</span>
                                            <span className="badge bg-light text-dark border ms-2">
                                                {SaveStatusEnum.getOptions(t).find(opt => opt.value === r.status)?.label || r.status}
                                            </span>
                                            <div className="ms-auto">
                                                {isOwner && SaveStatusEnum.getOptions(t)
                                                    .filter(opt => opt.value !== r.status && opt.value !== SaveStatusEnum.PENDING)
                                                    .map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            className="btn btn-xs btn-outline-secondary py-0 px-2 ms-1"
                                                            disabled={actionLoading === r.id}
                                                            onClick={() => onUpdateResultStatus(r.id, opt.value)}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};