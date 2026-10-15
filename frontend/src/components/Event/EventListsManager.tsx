import React, { useEffect, useRef, useState } from 'react';
import { Stack, Spinner, Table, Button, Card } from 'react-bootstrap';

import { hasListResult, ListInfoCells, ListInfoHeaderCells, ListResultDetailsRow } from './EventListRows';
import { type EventInteractions } from '../../services/Event/useEventInteractions';
import { useListResults } from '../../services/Event/useListResults';
import { EventDisciplineDistanceListResponse } from '../../api/responses/EventDisciplineDistanceListResponse';
import { EventResponse } from '../../api/responses/EventResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { getOptionLabel } from '../../utils/options';
import { FormErrorAlert, SelectField } from '../Common/FormFields';
import { StatusButtons } from '../Common/StatusButtons';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface EventListsManagerProps {
    eventObj: EventResponse;
    isMyProfile: boolean;
    isAdmin: boolean;
    interactions: EventInteractions;
}

export const EventListsManager: React.FC<EventListsManagerProps> = ({
    eventObj,
    isMyProfile,
    isAdmin,
    interactions,
}) => {
    const { t } = useTranslation();
    const [selectedDistanceId, setSelectedDistanceId] = useState<string>('');
    const [lists, setLists] = useState<EventDisciplineDistanceListResponse[]>([]);
    const [listUsers, setListUsers] = useState<Record<string, UserResponse>>({});
    const [loadingLists, setLoadingLists] = useState(false);
    const loadRequestId = useRef(0);

    const distanceObj = eventObj.disciplines.flatMap((d) => d.distances).find((d) => d.id === selectedDistanceId);
    const subDistances = distanceObj?.subDistances || [];
    const canManage = isMyProfile || isAdmin;
    const results = useListResults(subDistances, interactions, () => loadLists(selectedDistanceId));

    const loadLists = async (distId: string) => {
        const requestId = ++loadRequestId.current;
        const isLatest = () => requestId === loadRequestId.current;
        if (!distId) {
            setLists([]);
            setLoadingLists(false);
            return;
        }
        setLoadingLists(true);
        results.resetActiveList();
        try {
            const res = await interactions.fetchDistanceLists(distId);
            if (!isLatest()) return;

            setLists(res.lists);
            setListUsers(res.users);
        } catch (e) {
            console.error(e);
        } finally {
            if (isLatest()) setLoadingLists(false);
        }
    };

    useEffect(() => {
        loadLists(selectedDistanceId);
    }, [selectedDistanceId]);

    const handleStatusUpdate = async (listId: string, status: number) => {
        if (await interactions.handleListStatusSubmit(listId, status)) {
            loadLists(selectedDistanceId);
        }
    };

    const distanceOptions = eventObj.disciplines.flatMap((d) =>
        d.distances.map((dist) => ({
            value: dist.id,
            label: `${getOptionLabel(DisciplineEnum.getOptions(t), d.discipline)} - ${dist.distance}m`,
        })),
    );

    return (
        <Stack className="p-3" gap={3}>
            <Card.Title as="h6" className="text-profile-primary">
                {t('manage')}
            </Card.Title>
            <FormErrorAlert error={interactions.actionError} className="mb-0" />
            <SelectField
                label={t('selectDistanceSavedChanges')}
                value={selectedDistanceId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDistanceId(e.target.value)}
                options={distanceOptions}
                placeholder={t('selectDistance')}
            />

            {loadingLists ? (
                <Stack className="text-center">
                    <Spinner animation="border" size="sm" className="text-profile-primary" />
                </Stack>
            ) : selectedDistanceId && lists.length > 0 ? (
                <Table responsive borderless size="sm" className="align-middle border mb-0">
                    <TableHead className="table-light">
                        <TableRow>
                            <ListInfoHeaderCells />
                            <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {lists.map((list) => (
                            <React.Fragment key={list.id}>
                                <TableRow className="border-bottom">
                                    <ListInfoCells list={list} user={listUsers[list.userId]} results={results} />
                                    <TableCell className="text-end">
                                        {canManage && (
                                            <StatusButtons
                                                options={SaveStatusEnum.getOptions(t)}
                                                current={list.status}
                                                canSelect={(status) => status !== SaveStatusEnum.PENDING}
                                                onSelect={(status) => handleStatusUpdate(list.id, status)}
                                                disabled={interactions.actionLoading === list.id}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>

                                <ListResultDetailsRow
                                    list={list}
                                    results={results}
                                    interactions={interactions}
                                    subDistances={subDistances}
                                    canManage={canManage}
                                    colSpan={5}
                                />

                                {list.status === SaveStatusEnum.ACCEPTED &&
                                    !hasListResult(list) &&
                                    !results.isFormOpen(list.id) &&
                                    canManage && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-end p-2">
                                                <Button
                                                    variant="profile-outline-primary"
                                                    size="sm"
                                                    onClick={() => results.openAddForm(list)}
                                                >
                                                    {t('add')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                selectedDistanceId && <Stack className="text-center text-muted">{t('noRecords')}</Stack>
            )}
        </Stack>
    );
};
