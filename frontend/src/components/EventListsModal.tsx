import React, {useState} from 'react';
import {useTranslation} from '../context/TranslationContext';
import {EventResponse} from '../api/responses/EventResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {EventDisciplineDistanceListResponse} from '../api/responses/EventDisciplineDistanceListResponse';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {ColorEnum} from '../enums/ColorEnum';
import {formatDate} from '../utils/dateFormat';

interface EventListsModalProps {
    show: boolean;
    onClose: () => void;
    eventObj: EventResponse | null;
    ownerPage: any;
    selectedDistanceId: string;
    lists: EventDisciplineDistanceListResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isEventOwner: boolean;
    isAdmin: boolean;
    isParticipant: boolean;
    loading: boolean;
    actionLoading: boolean;
    onEnroll: () => void;
    onUpdateStatus: (listId: string, status: number) => void;
    onDelete: (listId: string) => void;
}

export const EventListsModal: React.FC<EventListsModalProps> = ({
                                                                    show,
                                                                    onClose,
                                                                    eventObj,
                                                                    ownerPage,
                                                                    selectedDistanceId,
                                                                    lists,
                                                                    relatedUsers,
                                                                    currentUser,
                                                                    isEventOwner,
                                                                    isAdmin,
                                                                    isParticipant,
                                                                    loading,
                                                                    actionLoading,
                                                                    onEnroll,
                                                                    onUpdateStatus,
                                                                    onDelete
                                                                }) => {
    const {t} = useTranslation();
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    if (!show || !eventObj) return null;

    const hexColor = ownerPage ? ColorEnum.getHex(ownerPage.color) : (currentUser ? ColorEnum.getHex(currentUser.color) : '#007bff');

    const distanceObj = eventObj.disciplines.flatMap(d => d.distances).find(d => d.id === selectedDistanceId);
    const isEnrolled = lists.some(l => l.userId === currentUser?.id);

    const toggleRow = (listId: string) => {
        setExpandedRows(prev => ({...prev, [listId]: !prev[listId]}));
    };

    return (
        <>
            <div className="modal d-block" tabIndex={-1} style={{'--theme-color': hexColor} as React.CSSProperties}>
                <div className="modal-dialog modal-xl modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {t('eventTypes.eventDisciplineList')} - {distanceObj?.distance} [m]
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} disabled={actionLoading}></button>
                        </div>
                        <div className="modal-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span>{t('participants')} ({lists.length})</span>
                                {(isParticipant && !isEnrolled) && (
                                    <button className="btn btn-sm btn-profile-primary" onClick={onEnroll} disabled={actionLoading}>
                                        {actionLoading ? <span className="spinner-border spinner-border-sm"/> : t('addBtn')}
                                    </button>
                                )}
                            </div>

                            {loading ? (
                                <div className="text-center my-4"><div className="spinner-border"/></div>
                            ) : (
                                <div className="table-responsive-custom">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                        <tr>
                                            <th>{t('photo')}</th>
                                            <th>{t('user')}</th>
                                            <th>{t('status')}</th>
                                            <th>{t('createdAt')}</th>
                                            <th>{t('eventTypes.eventDisciplineResult')}</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {lists.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center text-muted">{t('noParticipants')}</td>
                                            </tr>
                                        ) : lists.map(list => {
                                            const u = relatedUsers[list.userId];
                                            const hasResult = list.results && list.results.length > 0;
                                            const result = hasResult ? list.results[0] : null;
                                            const isExpanded = expandedRows[list.id];

                                            return (
                                                <React.Fragment key={list.id}>
                                                    <tr>
                                                        <td className="text-center align-middle feed-photo-cell">
                                                            {u?.profilePhoto ? (
                                                                <img src={`data:image/webp;base64,${u.profilePhoto}`} alt="User" className="rounded-circle img-fluid feed-photo"/>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {u ? (
                                                                <a href={`/users/${u.link}`} className="btn btn-link p-0 text-decoration-none">
                                                                    {u.firstName} {u.lastName}
                                                                </a>
                                                            ) : list.userId}
                                                        </td>
                                                        <td>{SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(list.status))?.label || list.status}</td>
                                                        <td>{formatDate(list.createdAt)}</td>
                                                        <td>
                                                            {hasResult ? (
                                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleRow(list.id)}>
                                                                    {isExpanded ? <i className="bi bi-chevron-up"></i> : <i className="bi bi-chevron-down"></i>} {t('time')}: {result?.time} [s]
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted small">-</span>
                                                            )}
                                                        </td>
                                                        <td className="text-end">
                                                            <div className="d-flex justify-content-end gap-1 flex-wrap">
                                                                {(isEventOwner || isAdmin) && SaveStatusEnum.getOptions(t)
                                                                    .filter(opt => opt.value !== list.status)
                                                                    .filter(opt => opt.value !== SaveStatusEnum.PENDING)
                                                                    .map(opt => (
                                                                        <button
                                                                            key={opt.value}
                                                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                                                            onClick={() => onUpdateStatus(list.id, opt.value)}
                                                                            disabled={actionLoading}
                                                                        >
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                {(isEventOwner || isAdmin || list.userId === currentUser?.id) && (
                                                                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => onDelete(list.id)} disabled={actionLoading}>
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && result && (
                                                        <tr className="bg-light">
                                                            <td colSpan={6}>
                                                                <div className="p-3 border rounded border-profile-primary">
                                                                    <strong className="d-block mb-2 text-profile-primary">{t('eventTypes.eventDisciplineResult')}</strong>
                                                                    <div><strong>{t('finalTimeSeconds')}:</strong> {result.time} [s]</div>
                                                                    {result.subResults && result.subResults.length > 0 && (
                                                                        <div className="mt-2">
                                                                            <strong className="small">{t('subDistances')}:</strong>
                                                                            <ul className="mb-0 list-unstyled ms-3">
                                                                                {result.subResults.map(sr => {
                                                                                    const sdMeta = distanceObj?.subDistances.find(sd => sd.id === sr.eventDisciplineSubDistanceId);
                                                                                    return (
                                                                                        <li key={sr.id} className="small text-muted">
                                                                                            <i className="bi bi-stopwatch me-1"></i>
                                                                                            {t('forDistance')} {sdMeta?.subDistance || '?'} [m] - {sr.time} [s]
                                                                                        </li>
                                                                                    );
                                                                                })}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    );
};