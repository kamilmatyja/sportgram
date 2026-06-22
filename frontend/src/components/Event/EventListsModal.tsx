import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {Link} from 'react-router-dom';
import {EventResponse} from '../../api/responses/EventResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {EventDisciplineDistanceListResponse} from '../../api/responses/EventDisciplineDistanceListResponse';
import {SaveStatusEnum} from '../../enums/SaveStatusEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {formatDate} from '../../utils/dateFormat';
import {EventResultBody} from '../../api/body/EventResultBody';
import {EventSubResult} from '../../api/body/EventSubResult';
import BootstrapIcon from '../Common/BootstrapIcon';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table.tsx';
import {Modal, Stack, Spinner, Table, Image, Button, Badge, Form, Card} from 'react-bootstrap';

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
                                                                    show, onClose, eventObj, ownerPage, selectedDistanceId, lists, relatedUsers,
                                                                    currentUser, isEventOwner, isAdmin, isParticipant, loading, actionLoading,
                                                                    onEnroll, onUpdateStatus, onDelete, interactions, refreshLists
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
        <Modal show={show} onHide={handleClose} size="xl" scrollable className={themeClass}>
            <Modal.Header closeButton>
                <Modal.Title>{t('eventTypes.eventDisciplineList')} - {distanceObj?.distance} [m]</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Stack direction="horizontal" className="justify-content-between align-items-center mb-3">
                    <Stack as="span">{t('participants')} ({lists.length})</Stack>
                    {(isParticipant && !isEnrolled) && (
                        <Button variant="profile-primary" size="sm" onClick={onEnroll} disabled={actionLoading}>
                            {actionLoading ? <Spinner animation="border" size="sm" /> : t('saveUp')}
                        </Button>
                    )}
                </Stack>

                {loading ? (
                    <Stack className="text-center my-4">
                        <Spinner animation="border" className="text-profile-primary" />
                    </Stack>
                ) : (
                    <Stack className="table-responsive-custom">
                        <Table bordered hover className="align-middle mb-0">
                            <TableHead className="table-light">
                            <TableRow>
                                <TableHeaderCell>{t('photo')}</TableHeaderCell>
                                <TableHeaderCell>{t('user')}</TableHeaderCell>
                                <TableHeaderCell>{t('status')}</TableHeaderCell>
                                <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                                <TableHeaderCell>{t('eventTypes.eventDisciplineResult')}</TableHeaderCell>
                                <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                            </TableRow>
                            </TableHead>
                            <TableBody>
                            {lists.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted">{t('noRecords')}</TableCell>
                                </TableRow>
                            ) : lists.map(list => {
                                const u = relatedUsers[list.userId];
                                const hasResult = list.results && list.results.length > 0;
                                const result = hasResult ? list.results[0] : null;
                                const isFormOpen = activeResultListId === list.id;
                                const isExpanded = expandedRows[list.id] || isFormOpen;

                                return (
                                    <React.Fragment key={list.id}>
                                        <TableRow>
                                            <TableCell className="text-center align-middle feed-photo-cell">
                                                {u?.profilePhoto ? (
                                                    <Image src={`data:image/webp;base64,${u.profilePhoto}`} alt="User" roundedCircle fluid className="feed-photo" />
                                                ) : (
                                                    <Stack as="span" className="text-muted">-</Stack>
                                                )}
                                            </TableCell>
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
                                                    <Button variant="outline-secondary" size="sm" className="py-0" onClick={() => handleToggleRow(list.id)}>
                                                        <BootstrapIcon name={isExpanded ? 'chevron-up' : 'chevron-down'} />
                                                        {hasResult ? ` ${t('time')}: ${result?.time} [s]` : ` ${t('resultFormTitle')}`}
                                                    </Button>
                                                ) : (
                                                    <Stack as="span" className="text-muted small">-</Stack>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <Stack direction="horizontal" className="justify-content-end gap-1 flex-wrap">
                                                    {(isEventOwner || isAdmin) && SaveStatusEnum.getOptions(t)
                                                        .filter(opt => opt.value !== list.status)
                                                        .filter(opt => opt.value !== SaveStatusEnum.PENDING)
                                                        .map(opt => (
                                                            <Button
                                                                key={opt.value}
                                                                variant="profile-outline-primary"
                                                                className="btn-xs py-0 px-2"
                                                                onClick={() => onUpdateStatus(list.id, opt.value)}
                                                                disabled={actionLoading}
                                                            >
                                                                {opt.label}
                                                            </Button>
                                                        ))}

                                                    {list.status === SaveStatusEnum.ACCEPTED && !hasResult && !isFormOpen && (isEventOwner || isAdmin) && (
                                                        <Button
                                                            variant="profile-primary"
                                                            className="btn-xs py-0 px-2"
                                                            onClick={() => openAddResultForm(list)}
                                                            disabled={actionLoading}
                                                        >
                                                            <BootstrapIcon name="plus-circle" className="me-1" /> {t('add')}
                                                        </Button>
                                                    )}

                                                    {(isEventOwner || isAdmin || list.userId === currentUser?.id) && (
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            className="py-0 px-2 ms-1"
                                                            onClick={() => onDelete(list.id)}
                                                            disabled={actionLoading}>
                                                            <BootstrapIcon name="trash" />
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && (hasResult || isFormOpen) && (
                                            <TableRow className="bg-light">
                                                <TableCell colSpan={6} className="p-0">
                                                    {isFormOpen ? (
                                                        <Stack className="border rounded border-profile-primary bg-white p-3 m-2">
                                                            <Card.Title as="h6" className="text-profile-primary">{t('resultFormTitle')}</Card.Title>
                                                            <Form.Group className="mb-2">
                                                                <Form.Label className="mb-0 small">{t('finalTimeSeconds')}</Form.Label>
                                                                <Form.Control type="number" size="sm" value={resultFormData.time}
                                                                              onChange={e => setResultFormData((prev: any) => ({
                                                                                  ...prev,
                                                                                  time: parseInt(e.target.value) || 0
                                                                              }))}/>
                                                            </Form.Group>
                                                            {resultFormData.subResults.length > 0 && <Stack as="strong" className="small">{t('subDistances')}:</Stack>}
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
                                                        <Stack className="p-3 border rounded border-profile-primary m-2 bg-white">
                                                            <Stack direction="horizontal" className="justify-content-between align-items-center mb-2">
                                                                <Stack as="strong" className="text-profile-primary">{t('eventTypes.eventDisciplineResult')}</Stack>
                                                                {(isEventOwner || isAdmin) && (
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
                                    </React.Fragment>
                                );
                            })}
                            </TableBody>
                        </Table>
                    </Stack>
                )}
            </Modal.Body>
        </Modal>
    );
};