import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {EventDisciplineDistanceListResponse} from '../../api/responses/EventDisciplineDistanceListResponse';
import {SaveStatusEnum} from '../../enums/SaveStatusEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {formatDate} from '../../utils/dateFormat';
import {EventResultBody} from '../../api/body/EventResultBody';
import {EventSubResult} from '../../api/body/EventSubResult';

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
    interactions: any;
    refreshLists: () => void;
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
                                                                    onDelete,
                                                                    interactions,
                                                                    refreshLists
                                                                }) => {
    const {t} = useTranslation();
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const [activeResultListId, setActiveResultListId] = useState<string | null>(null);
    const [activeResultId, setActiveResultId] = useState<string | null>(null);
    const [resultFormData, setResultFormData] = useState<EventResultBody>(new EventResultBody(0, []));

    if (!show || !eventObj) return null;

    const themeClass = ColorEnum.getClass(ownerPage?.color);

    const distanceObj = eventObj.disciplines.flatMap(d => d.distances).find(d => d.id === selectedDistanceId);
    const isEnrolled = lists.some(l => l.userId === currentUser?.id);

    const handleToggleRow = (listId: string) => {
        if (activeResultListId === listId) {
            setActiveResultListId(null);
        }
        setExpandedRows(prev => ({...prev, [listId]: !prev[listId]}));
    };

    const openAddResultForm = (list: EventDisciplineDistanceListResponse) => {
        const subRes: EventSubResult[] = distanceObj?.subDistances.map(sd => ({
            eventDisciplineSubDistanceId: sd.id,
            time: 0
        })) || [];
        setResultFormData(new EventResultBody(0, subRes));
        setActiveResultId(null);
        setActiveResultListId(list.id);
        setExpandedRows(prev => ({...prev, [list.id]: true}));
    };

    const openEditResultForm = (list: EventDisciplineDistanceListResponse, resultId: string) => {
        const resultObj = list.results?.find(r => r.id === resultId);
        if (!resultObj) return;

        const subRes: EventSubResult[] = resultObj.subResults?.map(sr => ({
            eventDisciplineSubDistanceId: sr.eventDisciplineSubDistanceId,
            time: sr.time
        })) || [];

        setResultFormData(new EventResultBody(resultObj.time, subRes));
        setActiveResultId(resultId);
        setActiveResultListId(list.id);
        setExpandedRows(prev => ({...prev, [list.id]: true}));
    };

    const saveResult = async () => {
        if (!activeResultListId) return;
        await interactions.handleSaveResult(activeResultListId, activeResultId, resultFormData);
        setActiveResultListId(null);
        refreshLists();
    };

    const deleteResult = async (resultId: string) => {
        await interactions.handleDeleteResult(resultId);
        refreshLists();
    };

    const handleClose = () => {
        setActiveResultListId(null);
        onClose();
    };

    return (
        <>
            <div className={`modal d-block ${themeClass}`} tabIndex={-1}>
                <div className="modal-dialog modal-xl modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {t('eventTypes.eventDisciplineList')} - {distanceObj?.distance} [m]
                            </h5>
                            <button type="button" className="btn-close" onClick={handleClose}
                                    disabled={actionLoading}></button>
                        </div>
                        <div className="modal-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span>{t('participants')} ({lists.length})</span>
                                {(isParticipant && !isEnrolled) && (
                                    <button className="btn btn-sm btn-profile-primary" onClick={onEnroll}
                                            disabled={actionLoading}>
                                        {actionLoading ?
                                            <span className="spinner-border spinner-border-sm"/> : t('saveUp')}
                                    </button>
                                )}
                            </div>

                            {loading ? (
                                <div className="text-center my-4">
                                    <div className="spinner-border text-profile-primary"/>
                                </div>
                            ) : (
                                <div className="table-responsive-custom">
                                    <table className="table table-bordered table-hover align-middle mb-0">
                                        <thead className="table-light">
                                        <tr>
                                            <th>{t('photo')}</th>
                                            <th>{t('user')}</th>
                                            <th>{t('status')}</th>
                                            <th>{t('createdAt')}</th>
                                            <th>{t('eventTypes.eventDisciplineResult')}</th>
                                            <th className="text-end">{t('manage')}</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {lists.length === 0 ? (
                                            <tr>
                                                <td colSpan={6}
                                                    className="text-center text-muted">{t('noRecords')}</td>
                                            </tr>
                                        ) : lists.map(list => {
                                            const u = relatedUsers[list.userId];
                                            const hasResult = list.results && list.results.length > 0;
                                            const result = hasResult ? list.results[0] : null;
                                            const isFormOpen = activeResultListId === list.id;
                                            const isExpanded = expandedRows[list.id] || isFormOpen;

                                            return (
                                                <React.Fragment key={list.id}>
                                                    <tr>
                                                        <td className="text-center align-middle feed-photo-cell">
                                                            {u?.profilePhoto ? (
                                                                <img src={`data:image/webp;base64,${u.profilePhoto}`}
                                                                     alt="User"
                                                                     className="rounded-circle img-fluid feed-photo"/>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {u ? (
                                                                <a href={`/users/${u.link}`}
                                                                   className="btn btn-link p-0 text-decoration-none">
                                                                    {u.firstName} {u.lastName}
                                                                </a>
                                                            ) : list.userId}
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-light text-dark border profile-theme-border">
                                                                {SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(list.status))?.label || list.status}
                                                            </span>
                                                        </td>
                                                        <td>{formatDate(list.createdAt)}</td>
                                                        <td>
                                                            {hasResult || isFormOpen ? (
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary py-0"
                                                                    onClick={() => handleToggleRow(list.id)}>
                                                                    {isExpanded ? <i className="bi bi-chevron-up"></i> :
                                                                        <i className="bi bi-chevron-down"></i>}
                                                                    {hasResult ? ` ${t('time')}: ${result?.time} [s]` : ` ${t('resultFormTitle')}`}
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

                                                                {list.status === SaveStatusEnum.ACCEPTED && !hasResult && !isFormOpen && (isEventOwner || isAdmin) && (
                                                                    <button
                                                                        className="btn btn-xs btn-profile-primary py-0 px-2"
                                                                        onClick={() => openAddResultForm(list)}
                                                                        disabled={actionLoading}
                                                                    >
                                                                        <i className="bi bi-plus-circle me-1"></i> {t('add')}
                                                                    </button>
                                                                )}

                                                                {(isEventOwner || isAdmin || list.userId === currentUser?.id) && (
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger py-0 px-2 ms-1"
                                                                        onClick={() => onDelete(list.id)}
                                                                        disabled={actionLoading}>
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (hasResult || isFormOpen) && (
                                                        <tr className="bg-light">
                                                            <td colSpan={6} className="p-0">
                                                                {isFormOpen ? (
                                                                    <div
                                                                        className="border rounded border-profile-primary bg-white p-3 m-2">
                                                                        <h6 className="text-profile-primary">{t('resultFormTitle')}</h6>
                                                                        <div className="mb-2">
                                                                            <label
                                                                                className="form-label mb-0 small">{t('finalTimeSeconds')}</label>
                                                                            <input type="number"
                                                                                   className="form-control form-control-sm"
                                                                                   value={resultFormData.time}
                                                                                   onChange={e => setResultFormData((prev: any) => ({
                                                                                       ...prev,
                                                                                       time: parseInt(e.target.value) || 0
                                                                                   }))}/>
                                                                        </div>
                                                                        {resultFormData.subResults.length > 0 && <strong
                                                                            className="small">{t('subDistances')}:</strong>}
                                                                        {resultFormData.subResults.map((sr, idx) => {
                                                                            const sdMeta = distanceObj?.subDistances.find(sd => sd.id === sr.eventDisciplineSubDistanceId);
                                                                            return (
                                                                                <div key={idx}
                                                                                     className="d-flex align-items-center gap-2 mb-1">
                                                                                    <span
                                                                                        className="small text-muted w-50">{t('forDistance')} {sdMeta?.subDistance || '?'} [m]:</span>
                                                                                    <input type="number"
                                                                                           className="form-control form-control-sm w-50"
                                                                                           placeholder={t('timeSeconds')}
                                                                                           value={sr.time}
                                                                                           onChange={e => {
                                                                                               const newSubs = [...resultFormData.subResults];
                                                                                               newSubs[idx].time = parseInt(e.target.value) || 0;
                                                                                               setResultFormData((prev: any) => ({
                                                                                                   ...prev,
                                                                                                   subResults: newSubs
                                                                                               }));
                                                                                           }}/>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        <div className="mt-2 text-end">
                                                                            <button
                                                                                className="btn btn-sm btn-secondary me-2"
                                                                                onClick={() => setActiveResultListId(null)}>{t('cancel')}</button>
                                                                            <button
                                                                                className="btn btn-sm btn-profile-primary"
                                                                                onClick={saveResult}
                                                                                disabled={interactions.actionLoading !== null}>{t('save')}</button>
                                                                        </div>
                                                                    </div>
                                                                ) : result ? (
                                                                    <div
                                                                        className="p-3 border rounded border-profile-primary m-2 bg-white">
                                                                        <div
                                                                            className="d-flex justify-content-between align-items-center mb-2">
                                                                            <strong
                                                                                className="text-profile-primary">{t('eventTypes.eventDisciplineResult')}</strong>
                                                                            {(isEventOwner || isAdmin) && (
                                                                                <div>
                                                                                    <button
                                                                                        className="btn btn-sm btn-outline-secondary me-1 py-0"
                                                                                        onClick={() => openEditResultForm(list, result.id)}>
                                                                                        <i className="bi bi-pencil"></i>
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn btn-sm btn-outline-danger py-0"
                                                                                        disabled={interactions.actionLoading === 'delete_result'}
                                                                                        onClick={() => deleteResult(result.id)}>
                                                                                        <i className="bi bi-trash"></i>
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <strong>{t('finalTimeSeconds')}:</strong> {result.time} [s]
                                                                        </div>
                                                                        {result.subResults && result.subResults.length > 0 && (
                                                                            <div className="mt-2">
                                                                                <strong
                                                                                    className="small">{t('subDistances')}:</strong>
                                                                                <ul className="mb-0 list-unstyled ms-3">
                                                                                    {result.subResults.map(sr => {
                                                                                        const sdMeta = distanceObj?.subDistances.find(sd => sd.id === sr.eventDisciplineSubDistanceId);
                                                                                        return (
                                                                                            <li key={sr.id}
                                                                                                className="small text-muted">
                                                                                                <i className="bi bi-stopwatch me-1"></i>
                                                                                                {t('forDistance')} {sdMeta?.subDistance || '?'} [m]
                                                                                                - {sr.time} [s]
                                                                                            </li>
                                                                                        );
                                                                                    })}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : null}
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