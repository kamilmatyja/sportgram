import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { TrainingParticipantResponse } from '../../api/responses/TrainingParticipantResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { formatDate } from '../../utils/dateFormat';

interface TrainingParticipantsTableProps {
    participants: TrainingParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onUpdateStatus: (participantId: string, status: number) => void;
}

export const TrainingParticipantsTable: React.FC<TrainingParticipantsTableProps> = ({
                                                                                        participants, relatedUsers, currentUser, isMyProfile, isAdmin, actionLoading, onUpdateStatus
                                                                                    }) => {
    const { t } = useTranslation();

    if (!participants || participants.length === 0) {
        return <div className="text-muted small p-2">{t('noParticipants')}</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-borderless align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('user')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th className="text-end">{t('manage')}</th>
                </tr>
                </thead>
                <tbody>
                {participants.map(p => {
                    const u = relatedUsers[p.userId];
                    const isOwner = currentUser?.id === p.userId;
                    const canManage = isMyProfile || isAdmin || isOwner;

                    return (
                        <tr key={p.id}>
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
                            <td>{formatDate(p.createdAt)}</td>
                            <td className="text-end">
                                {canManage && SaveStatusEnum.getOptions(t)
                                    .filter(opt => opt.value !== p.status && opt.value !== SaveStatusEnum.PENDING)
                                    .map(opt => (
                                        <button
                                            key={opt.value}
                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2 ms-1"
                                            disabled={actionLoading === p.id}
                                            onClick={() => onUpdateStatus(p.id, opt.value)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};