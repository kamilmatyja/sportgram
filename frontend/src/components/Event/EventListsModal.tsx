import React from 'react';
import { Modal, Stack, Spinner, Table, Button } from 'react-bootstrap';

import { hasListResult, ListInfoCells, ListInfoHeaderCells, ListResultDetailsRow } from './EventListRows';
import { useListResults } from '../../services/Event/useListResults';
import { EventDisciplineDistanceListResponse } from '../../api/responses/EventDisciplineDistanceListResponse';
import { EventResponse } from '../../api/responses/EventResponse';
import { PageResponse } from '../../api/responses/PageResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type EventInteractions } from '../../services/Event/useEventInteractions';
import { ColorEnum } from '../../enums/ColorEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { Base64Image } from '../Common/Base64Image';
import BootstrapIcon from '../Common/BootstrapIcon';
import { FormErrorAlert } from '../Common/FormFields';
import { StatusButtons } from '../Common/StatusButtons';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface EventListsModalProps {
    show: boolean;
    onClose: () => void;
    eventObj: EventResponse | null;
    ownerPage: PageResponse | null;
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
    interactions: EventInteractions;
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
    refreshLists,
}) => {
    const { t } = useTranslation();
    const distanceObj = eventObj?.disciplines.flatMap((d) => d.distances).find((d) => d.id === selectedDistanceId);
    const subDistances = distanceObj?.subDistances || [];
    const results = useListResults(subDistances, interactions, refreshLists);

    if (!show || !eventObj) return null;

    const themeClass = ColorEnum.getClass(ownerPage?.color);
    const isEnrolled = lists.some((l) => l.userId === currentUser?.id);
    const canManage = isEventOwner || isAdmin;

    return (
        <Modal show={show} onHide={onClose} size="xl" scrollable className={themeClass}>
            <Modal.Header closeButton>
                <Modal.Title>
                    {t('eventTypes.eventDisciplineList')} - {distanceObj?.distance} [m]
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <FormErrorAlert error={interactions.actionError} />
                <Stack direction="horizontal" className="justify-content-between align-items-center mb-3">
                    <Stack as="span" className="fw-bold">
                        {t('participants')} ({lists.length})
                    </Stack>
                    {isParticipant && !isEnrolled && (
                        <Button variant="profile-primary" size="sm" onClick={onEnroll} disabled={actionLoading}>
                            {actionLoading ? <Spinner animation="border" size="sm" /> : t('saveUp')}
                        </Button>
                    )}
                </Stack>

                {loading ? (
                    <Stack className="text-center p-4">
                        <Spinner animation="border" className="text-profile-primary" />
                    </Stack>
                ) : (
                    <Stack className="table-responsive-custom">
                        <Table bordered hover className="align-middle mb-0 shadow-sm">
                            <TableHead className="table-light">
                                <TableRow>
                                    <TableHeaderCell>{t('photo')}</TableHeaderCell>
                                    <ListInfoHeaderCells />
                                    <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lists.length === 0 ? (
                                    <EmptyTableRow colSpan={6} />
                                ) : (
                                    lists.map((list) => {
                                        const u = relatedUsers[list.userId];

                                        return (
                                            <React.Fragment key={list.id}>
                                                <TableRow>
                                                    <TableCell className="text-center feed-photo-cell">
                                                        <Base64Image
                                                            data={u?.profilePhoto}
                                                            fallback={
                                                                <Stack as="span" className="text-muted">
                                                                    -
                                                                </Stack>
                                                            }
                                                            roundedCircle
                                                            fluid
                                                            className="feed-photo"
                                                        />
                                                    </TableCell>
                                                    <ListInfoCells list={list} user={u} results={results} />
                                                    <TableCell className="text-end">
                                                        <Stack
                                                            direction="horizontal"
                                                            gap={1}
                                                            className="justify-content-end flex-wrap"
                                                        >
                                                            {canManage && (
                                                                <StatusButtons
                                                                    options={SaveStatusEnum.getOptions(t)}
                                                                    current={list.status}
                                                                    canSelect={(status) =>
                                                                        status !== SaveStatusEnum.PENDING
                                                                    }
                                                                    onSelect={(status) =>
                                                                        onUpdateStatus(list.id, status)
                                                                    }
                                                                    disabled={actionLoading}
                                                                />
                                                            )}
                                                            {list.status === SaveStatusEnum.ACCEPTED &&
                                                                !hasListResult(list) &&
                                                                !results.isFormOpen(list.id) &&
                                                                canManage && (
                                                                    <Button
                                                                        variant="profile-primary"
                                                                        className="btn-xs py-0 px-2"
                                                                        onClick={() => results.openAddForm(list)}
                                                                        disabled={actionLoading}
                                                                    >
                                                                        <BootstrapIcon
                                                                            name="plus-circle"
                                                                            className="me-1"
                                                                        />
                                                                        {t('add')}
                                                                    </Button>
                                                                )}
                                                            {(canManage || list.userId === currentUser?.id) && (
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    className="py-0 px-2"
                                                                    onClick={() => onDelete(list.id)}
                                                                    disabled={actionLoading}
                                                                    aria-label={t('delete')}
                                                                >
                                                                    <BootstrapIcon name="trash" />
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                                <ListResultDetailsRow
                                                    list={list}
                                                    results={results}
                                                    interactions={interactions}
                                                    subDistances={subDistances}
                                                    canManage={canManage}
                                                    colSpan={6}
                                                />
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Stack>
                )}
            </Modal.Body>
        </Modal>
    );
};
