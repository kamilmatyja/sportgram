import React, {useEffect, useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {Link} from 'react-router-dom';
import {EventResponse} from '../../api/responses/EventResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {EventDisciplineDistanceListResponse} from '../../api/responses/EventDisciplineDistanceListResponse';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {SaveStatusEnum} from '../../enums/SaveStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {EventResultBody} from '../../api/body/EventResultBody';
import {EventSubResult} from '../../api/body/EventSubResult';
import BootstrapIcon from '../Common/BootstrapIcon';
import SelectOptions from '../Common/SelectOptions';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Html';
import {Stack, Form, Spinner, Table, Button, Badge, Card} from 'react-bootstrap';

interface EventListsManagerProps {
    eventObj: EventResponse;
    isMyProfile: boolean;
    isAdmin: boolean;
    interactions: any;
}

export const EventListsManager: React.FC<EventListsManagerProps> = ({
                                                                        eventObj, isMyProfile, isAdmin, interactions
                                                                    }) => {
    const {t} = useTranslation();
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
        if (activeResultListId === listId) {
            setActiveResultListId(null);
        }
        setExpandedRows(prev => ({...prev, [listId]: !prev[listId]}));
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
        loadLists(selectedDistanceId);
    };

    const deleteResult = async (resultId: string) => {
        await interactions.handleDeleteResult(resultId);
        loadLists(selectedDistanceId);
    };

    const distanceOptions = eventObj.disciplines.flatMap(d => d.distances.map(dist => ({
        value: dist.id,
        label: `${DisciplineEnum.getOptions(t).find(o => o.value === d.discipline)?.label} - ${dist.distance}m`
    })));

    return (
        <Stack className="p-3">
            <Card.Title as="h6" className="text-profile-primary mb-3">{t('manage')}</Card.Title>
            <Form.Group className="mb-3">
                <Form.Label className="fw-bold">{t('selectDistanceSavedChanges')}</Form.Label>
                <Form.Select value={selectedDistanceId} onChange={e => setSelectedDistanceId(e.target.value)}>
                    <SelectOptions options={distanceOptions} placeholder={t('selectDistance')} />
                </Form.Select>
            </Form.Group>

            {loadingLists && (
                <Stack className="text-center my-3">
                    <Spinner animation="border" size="sm" className="text-profile-primary" />
                </Stack>
            )}

            {!loadingLists && selectedDistanceId && lists.length > 0 && (
                <Table responsive borderless size="sm" className="align-middle mb-0 border">
                    <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('eventTypes.eventDisciplineResult')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {lists.map(list => {
                        const u = listUsers[list.userId];
                        const hasResult = list.results && list.results.length > 0;
                        const result = hasResult ? list.results[0] : null;
                        const isFormOpen = activeResultListId === list.id;
                        const isExpanded = expandedRows[list.id] || isFormOpen;

                        return (
                            <React.Fragment key={list.id}>
                                <TableRow className="border-bottom">
                                    <TableCell>
                                        {u ? (
                                            <Link to={`/users/${u.link}`} className="btn btn-link p-0 text-decoration-none">
                                                {u.firstName} {u.lastName}
                                            </Link>
                                        ) : list.userId}
                                    </TableCell>
                                    <TableCell>
                                        <Badge bg="light" text="dark" className="border profile-theme-border">
                                            {SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(list.status))?.label || list.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(list.createdAt)}</TableCell>
                                    <TableCell>
                                        {hasResult || isFormOpen ? (
                                            <Button variant="outline-secondary" size="sm" className="py-0" onClick={() => toggleRow(list.id)}>
                                                <BootstrapIcon name={isExpanded ? 'chevron-up' : 'chevron-down'} />
                                                {hasResult ? ` ${t('time')}: ${result?.time} [s]` : ` ${t('resultFormTitle')}`}
                                            </Button>
                                        ) : <Stack as="span" className="text-muted small">-</Stack>}
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <Stack direction="horizontal" className="justify-content-end gap-1 flex-wrap">
                                            {(isMyProfile || isAdmin) && SaveStatusEnum.getOptions(t)
                                                .filter(opt => opt.value !== list.status && opt.value !== SaveStatusEnum.PENDING)
                                                .map(opt => (
                                                    <Button key={opt.value} variant="profile-outline-primary" className="btn-xs py-0 px-2"
                                                            disabled={interactions.actionLoading === list.id}
                                                            onClick={() => handleStatusUpdate(list.id, opt.value)}>
                                                        {opt.label}
                                                    </Button>
                                                ))}
                                        </Stack>
                                    </TableCell>
                                </TableRow>

                                {isExpanded && (hasResult || isFormOpen) && (
                                    <TableRow className="bg-light">
                                        <TableCell colSpan={5} className="p-3">
                                            {isFormOpen ? (
                                                <Stack className="border rounded border-profile-primary bg-white p-3">
                                                    <Card.Title as="h6" className="text-profile-primary">{t('resultFormTitle')}</Card.Title>
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="mb-0 small">{t('finalTimeSeconds')}</Form.Label>
                                                        <Form.Control type="number" size="sm" value={resultFormData.time}
                                                                      onChange={e => setResultFormData((prev: any) => ({
                                                                          ...prev,
                                                                          time: parseInt(e.target.value) || 0
                                                                      }))}/>
                                                    </Form.Group>
                                                    {resultFormData.subResults.length > 0 &&
                                                        <Stack as="strong" className="small">{t('subDistances')}:</Stack>}
                                                    {resultFormData.subResults.map((sr, idx) => {
                                                        const sdMeta = distanceObj?.subDistances.find(sd => sd.id === sr.eventDisciplineSubDistanceId);
                                                        return (
                                                            <Stack key={idx} direction="horizontal" gap={2} className="align-items-center mb-1">
                                                                <Stack as="span" className="small text-muted w-50">{t('forDistance')} {sdMeta?.subDistance || '?'} [m]:</Stack>
                                                                <Form.Control type="number" size="sm" className="w-50" placeholder={t('timeSeconds')} value={sr.time}
                                                                              onChange={e => {
                                                                                  const newSubs = [...resultFormData.subResults];
                                                                                  newSubs[idx].time = parseInt(e.target.value) || 0;
                                                                                  setResultFormData((prev: any) => ({
                                                                                      ...prev,
                                                                                      subResults: newSubs
                                                                                  }));
                                                                              }}/>
                                                            </Stack>
                                                        );
                                                    })}
                                                    <Stack direction="horizontal" className="mt-2 justify-content-end">
                                                        <Button variant="secondary" size="sm" className="me-2" onClick={() => setActiveResultListId(null)}>{t('cancel')}</Button>
                                                        <Button variant="profile-primary" size="sm" onClick={saveResult} disabled={interactions.actionLoading !== null}>{t('save')}</Button>
                                                    </Stack>
                                                </Stack>
                                            ) : result ? (
                                                <Stack className="border rounded border-profile-primary bg-white p-3">
                                                    <Stack direction="horizontal" className="justify-content-between align-items-center mb-2">
                                                        <Stack as="strong" className="text-profile-primary">{t('eventTypes.eventDisciplineResult')}</Stack>
                                                        {(isMyProfile || isAdmin) && (
                                                            <Stack direction="horizontal">
                                                                <Button variant="outline-secondary" size="sm" className="me-1 py-0" onClick={() => openEditResultForm(list, result.id)}>
                                                                    <BootstrapIcon name="pencil" />
                                                                </Button>
                                                                <Button variant="outline-danger" size="sm" className="py-0" disabled={interactions.actionLoading === 'delete_result'} onClick={() => deleteResult(result.id)}>
                                                                    <BootstrapIcon name="trash" />
                                                                </Button>
                                                            </Stack>
                                                        )}
                                                    </Stack>
                                                    <Stack direction="horizontal" gap={1}>
                                                        <Stack as="span" className="fw-bold">{t('finalTimeSeconds')}:</Stack>
                                                        <Stack as="span">{result.time} [s]</Stack>
                                                    </Stack>
                                                    {result.subResults && result.subResults.length > 0 && (
                                                        <Stack className="mt-2">
                                                            <Stack as="strong" className="small">{t('subDistances')}:</Stack>
                                                            <Stack as="ul" className="mb-0 list-unstyled ms-3">
                                                                {result.subResults.map(sr => {
                                                                    const sdMeta = distanceObj?.subDistances.find(sd => sd.id === sr.eventDisciplineSubDistanceId);
                                                                    return (
                                                                        <Stack as="li" key={sr.id} className="small text-muted">
                                                                            <BootstrapIcon name="stopwatch" className="me-1" />
                                                                            {t('forDistance')} {sdMeta?.subDistance || '?'} [m] - {sr.time} [s]
                                                                        </Stack>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {list.status === SaveStatusEnum.ACCEPTED && !hasResult && !isFormOpen && (isMyProfile || isAdmin) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-end border-bottom">
                                            <Button variant="profile-outline-primary" size="sm" onClick={() => openAddResultForm(list)}>{t('add')}</Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        );
                    })}
                    </TableBody>
                </Table>
            )}
            {!loadingLists && selectedDistanceId && lists.length === 0 && (
                <Stack className="text-muted small mt-2">{t('noRecords')}</Stack>
            )}
        </Stack>
    );
};