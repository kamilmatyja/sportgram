import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {TrainingParticipantsTable} from './TrainingParticipantsTable';

interface UserTrainingsTableProps {
    trainings: TrainingResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (training: TrainingResponse) => void;
    interactions: any;
}

export const UserTrainingsTable: React.FC<UserTrainingsTableProps> = ({
                                                                          trainings,
                                                                          relatedUsers,
                                                                          currentUser,
                                                                          isMyProfile,
                                                                          isAdmin,
                                                                          actionLoading,
                                                                          onManageClick,
                                                                          interactions
                                                                      }) => {
    const {t} = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    if (trainings.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle mb-0">
                    <tbody>
                    <tr>
                        <td colSpan={7} className="text-center text-muted">{t('noTrainings')}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('title')}</th>
                    <th>{t('location')}</th>
                    <th>{t('startedAt')}</th>
                    <th>{t('endedAt')}</th>
                    <th>{t('status')}</th>
                    <th>{t('details')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {trainings.map(tr => (
                    <React.Fragment key={tr.id}>
                        <tr>
                            <td>
                                <a href={`/trainings/${tr.link}`} className="btn btn-link p-0 text-decoration-none">
                                    {tr.title}
                                </a>
                            </td>
                            <td>{tr.location}</td>
                            <td>{formatDate(tr.startedAt)}</td>
                            <td>{formatDate(tr.endedAt)}</td>
                            <td>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(tr.status))?.label || tr.status}
                                </span>
                            </td>
                            <td>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleRow(tr.id)}>
                                    {expandedRow === tr.id ? <i className="bi bi-chevron-up"></i> :
                                        <i className="bi bi-chevron-down"></i>} {t('participants')}
                                </button>
                            </td>
                            <td className="text-end">
                                {(isMyProfile || isAdmin || tr.participants?.some(p => p.userId === currentUser?.id)) && (
                                    <button className="btn btn-sm btn-profile-outline-primary" title={t('manage')}
                                            onClick={() => onManageClick(tr)}>
                                        <i className="bi bi-gear" aria-hidden="true"></i>
                                        <span className="visually-hidden">{t('manage')}</span>
                                    </button>
                                )}
                            </td>
                        </tr>
                        {expandedRow === tr.id && (
                            <tr className="bg-light">
                                <td colSpan={7} className="p-3">
                                    <div className="border rounded border-profile-primary bg-white p-3">
                                        <h6 className="mb-3 text-profile-primary">{t('participants')} ({tr.participants?.length || 0})</h6>
                                        <TrainingParticipantsTable
                                            participants={tr.participants || []}
                                            relatedUsers={relatedUsers}
                                            currentUser={currentUser}
                                            isMyProfile={isMyProfile}
                                            isAdmin={isAdmin}
                                            actionLoading={actionLoading}
                                            onUpdateStatus={interactions.handleParticipantStatusSubmit}
                                        />
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
};