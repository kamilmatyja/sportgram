import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { EventResponse } from '../../api/responses/EventResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { EventDisciplineDistanceListResponse } from '../../api/responses/EventDisciplineDistanceListResponse';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { EventResultBody } from '../../api/body/EventResultBody';
import { EventSubResult } from '../../api/body/EventSubResult';

interface EventListsManagerProps {
    eventObj: EventResponse;
    isMyProfile: boolean;
    isAdmin: boolean;
    interactions: any;
}

export const EventListsManager: React.FC<EventListsManagerProps> = ({
                                                                        eventObj, isMyProfile, isAdmin, interactions
                                                                    }) => {
    const { t } = useTranslation();
    const [selectedDistanceId, setSelectedDistanceId] = useState<string>('');
    const [lists, setLists] = useState<EventDisciplineDistanceListResponse[]>([]);
    const [listUsers, setListUsers] = useState<Record<string, UserResponse>>({});
    const [loadingLists, setLoadingLists] = useState(false);

    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [activeResultListId, setActiveResultListId] = useState<string | null>(null);
    const [resultFormData, setResultFormData] = useState<EventResultBody>(new EventResultBody(0, []));
    const [activeResultId, setActiveResultId] = useState<string | null>(null);

    const loadLists = async (distId: string) => {
        if (!distId) {
            setLists([]);
            return;
        }
        setLoadingLists(true);
        setActiveResultListId(null);
        try {
            const res = await interactions.fetchDistanceLists(distId);
            setLists(res.lists);
            setListUsers(res.users);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingLists(false);
        }
    };

    useEffect(() => {
        if (selectedDistanceId) {
            loadLists(selectedDistanceId);
        }
    }, [selectedDistanceId]);

    const distanceObj = eventObj.disciplines.flatMap(d => d.distances).find(d => d.id === selectedDistanceId);

    const toggleRow = (listId: string) => {
        setExpandedRows(prev => ({ ...prev, [listId]: !prev[listId] }));
    };

    const handleStatusUpdate = async (listId: string, status: number) => {
        await interactions.handleListStatusSubmit(listId, status);
        loadLists(selectedDistanceId);
    };

    const openAddResultForm = (list: EventDisciplineDistanceListResponse) => {
        const subRes: EventSubResult[] = distanceObj?.subDistances.map(sd => ({
            eventDisciplineSubDistanceId: sd.id,
            time: 0
        })) || [];
        setResultFormData(new EventResultBody(0, subRes));
        setActiveResultId(null);
        setActiveResultListId(list.id);
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
    };

    const saveResult = async () => {
        if (!activeResultListId) return;
        await interactions.handleSaveResult(activeResultListId, activeResultId, resultFormData);
        setActiveResultListId(null);
        loadLists(selectedDistanceId);
    };

    const deleteResult = async (resultId: string) => {
        await interactions.handleDeleteResult(resultId);
        loadLists(selectedDistanceId);
    };

    return (
        <div className="p-3">
            <h6 className="text-profile-primary mb-3">{t('manageListsAndResults')}</h6>
            <div className="mb-3">
                <label className="form-label fw-bold">{t('selectDistanceSavedChanges')}</label>
                <select className="form-select" value={selectedDistanceId} onChange={e => setSelectedDistanceId(e.target.value)}>
                    <option value="">{t('selectDistance')}</option>
                    {eventObj.disciplines.flatMap(d => d.distances.map(dist => ({
                        id: dist.id,
                        label: `${DisciplineEnum.getOptions(t).find(o => o.value === d.discipline)?.label} - ${dist.distance}m`
                    }))).map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {loadingLists && <div className="text-center my-3"><div className="spinner-border spinner-border-sm text-profile-primary" /></div>}

            {!loadingLists && selectedDistanceId && lists.length > 0 && (
                <div className="table-responsive">
                    <table className="table table-sm table-borderless align-middle mb-0 border">
                        <thead className="table-light">
                        <tr>
                            <th>{t('user')}</th>
                            <th>{t('status')}</th>
                            <th>{t('createdAt')}</th>
                            <th>{t('eventTypes.eventDisciplineResult')}</th>
                            <th className="text-end">{t('manage')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {lists.map(list => {
                            const u = listUsers[list.userId];
                            const hasResult = list.results && list.results.length > 0;
                            const result = hasResult ? list.results[0] : null;
                            const isExpanded = expandedRows[list.id];

                            return (
                                <React.Fragment key={list.id}>
                                    <tr className="border-bottom">
                                        <td>
                                            {u ? (
                                                <a href={`/users/${u.link}`} className="text-decoration-none">
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
                                            {hasResult ? (
                                                <button className="btn btn-sm btn-outline-secondary py-0" onClick={() => toggleRow(list.id)}>
                                                    {isExpanded ? <i className="bi bi-chevron-up"></i> : <i className="bi bi-chevron-down"></i>} {t('time')}: {result?.time} [s]
                                                </button>
                                            ) : <span className="text-muted small">-</span>}
                                        </td>
                                        <td className="text-end">
                                            <div className="d-flex justify-content-end gap-1 flex-wrap">
                                                {(isMyProfile || isAdmin) && SaveStatusEnum.getOptions(t)
                                                    .filter(opt => opt.value !== list.status && opt.value !== SaveStatusEnum.PENDING)
                                                    .map(opt => (
                                                        <button key={opt.value} className="btn btn-xs btn-profile-outline-primary py-0 px-2" disabled={interactions.actionLoading === list.id} onClick={() => handleStatusUpdate(list.id, opt.value)}>
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && result && (
                                        <tr className="bg-light">
                                            <td colSpan={5} className="p-3">
                                                <div className="border rounded border-profile-primary bg-white p-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <strong className="text-profile-primary">{t('eventTypes.eventDisciplineResult')}</strong>
                                                        {(isMyProfile || isAdmin) && (
                                                            <div>
                                                                <button className="btn btn-sm btn-outline-secondary me-1 py-0" onClick={() => openEditResultForm(list, result.id)}><i className="bi bi-pencil"></i></button>
                                                                <button className="btn btn-sm btn-outline-danger py-0" disabled={interactions.actionLoading === 'delete_result'} onClick={() => deleteResult(result.id)}><i className="bi bi-trash"></i></button>
                                                            </div>
                                                        )}
                                                    </div>
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

                                    {activeResultListId === list.id && (
                                        <tr className="bg-light">
                                            <td colSpan={5} className="p-3">
                                                <div className="border rounded border-profile-primary bg-white p-3">
                                                    <h6 className="text-profile-primary">{t('resultFormTitle')}</h6>
                                                    <div className="mb-2">
                                                        <label className="form-label mb-0 small">{t('finalTimeSeconds')}</label>
                                                        <input type="number" className="form-control form-control-sm" value={resultFormData.time} onChange={e => setResultFormData((prev: any) => ({ ...prev, time: parseInt(e.target.value) || 0 }))} />
                                                    </div>
                                                    {resultFormData.subResults.length > 0 && <strong className="small">{t('subDistances')}:</strong>}
                                                    {resultFormData.subResults.map((sr, idx) => {
                                                        const sdMeta = distanceObj?.subDistances.find(sd => sd.id === sr.eventDisciplineSubDistanceId);
                                                        return (
                                                            <div key={idx} className="d-flex align-items-center gap-2 mb-1">
                                                                <span className="small text-muted w-50">{t('forDistance')} {sdMeta?.subDistance || '?'} [m]:</span>
                                                                <input type="number" className="form-control form-control-sm w-50" placeholder={t('timeSeconds')} value={sr.time} onChange={e => {
                                                                    const newSubs = [...resultFormData.subResults];
                                                                    newSubs[idx].time = parseInt(e.target.value) || 0;
                                                                    setResultFormData((prev: any) => ({ ...prev, subResults: newSubs }));
                                                                }} />
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="mt-2 text-end">
                                                        <button className="btn btn-sm btn-secondary me-2" onClick={() => setActiveResultListId(null)}>{t('cancel')}</button>
                                                        <button className="btn btn-sm btn-profile-primary" onClick={saveResult} disabled={interactions.actionLoading !== null}>{t('saveResultBtn')}</button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {list.status === SaveStatusEnum.ACCEPTED && !hasResult && !activeResultListId && (isMyProfile || isAdmin) && (
                                        <tr>
                                            <td colSpan={5} className="text-end border-bottom">
                                                <button className="btn btn-sm btn-profile-outline-primary" onClick={() => openAddResultForm(list)}>{t('enterResultBtn')}</button>
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
            {!loadingLists && selectedDistanceId && lists.length === 0 && (
                <div className="text-muted small mt-2">{t('noRegistrationsForDistance')}</div>
            )}
        </div>
    );
};