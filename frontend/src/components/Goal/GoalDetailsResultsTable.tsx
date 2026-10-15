import React from 'react';
import { Table, Stack } from 'react-bootstrap';

import { GoalParticipantResponse } from '../../api/responses/GoalParticipantResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { EnumBadge } from '../Common/EnumBadge';
import { canChangeOwnStatus } from '../Common/statusPermissions';
import { StatusButtons } from '../Common/StatusButtons';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';
import { UserLink } from '../Common/UserLink';

interface GoalDetailsResultsTableProps {
    participants: GoalParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateStatus: (resultId: string, status: number) => void;
}

export const GoalDetailsResultsTable: React.FC<GoalDetailsResultsTableProps> = ({
    participants,
    relatedUsers,
    currentUser,
    actionLoading,
    onUpdateStatus,
}) => {
    const { t } = useTranslation();
    const statusOptions = SaveStatusEnum.getOptions(t);
    const canManage = canChangeOwnStatus(currentUser);

    const allResults = participants.flatMap((p) => (p.results ?? []).map((r) => ({ ...r, userId: p.userId })));

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                        <TableHeaderCell>{t('distance')} [m]</TableHeaderCell>
                        <TableHeaderCell>{t('timeSeconds')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {allResults.length === 0 ? (
                        <EmptyTableRow colSpan={5} />
                    ) : (
                        allResults.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>
                                    <UserLink user={relatedUsers[r.userId]} />
                                </TableCell>
                                <TableCell>{r.distance}</TableCell>
                                <TableCell>{r.time}</TableCell>
                                <TableCell>
                                    <EnumBadge options={statusOptions} value={r.status} />
                                </TableCell>
                                <TableCell className="text-end">
                                    {canManage(r) && (
                                        <StatusButtons
                                            options={statusOptions}
                                            current={r.status}
                                            canSelect={(status) => status !== SaveStatusEnum.PENDING}
                                            onSelect={(status) => onUpdateStatus(r.id, status)}
                                            disabled={actionLoading === r.id}
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
