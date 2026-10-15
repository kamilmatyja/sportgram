import { Fragment, type ReactNode } from 'react';
import { Stack, Table } from 'react-bootstrap';

import { EnumBadge } from './EnumBadge';
import { StatusButtons } from './StatusButtons';
import { EmptyTableRow, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from './Table';
import { UserLink } from './UserLink';
import { type UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';

interface Participant {
    id: string;
    userId: string;
    status: number;
}

interface ParticipantsTableProps<T extends Participant> {
    participants: T[];
    relatedUsers: Record<string, UserResponse>;
    canManage: boolean | ((participant: T) => boolean);
    actionLoading: string | null;
    onUpdateStatus: (participantId: string, status: number) => void;
    compact?: boolean;
    renderDetails?: (participant: T) => ReactNode;
}

const canSelectStatus = (status: number): boolean => status !== SaveStatusEnum.PENDING;

export const ParticipantsTable = <T extends Participant>({
    participants,
    relatedUsers,
    canManage,
    actionLoading,
    onUpdateStatus,
    compact = false,
    renderDetails,
}: ParticipantsTableProps<T>) => {
    const { t } = useTranslation();
    const statusOptions = SaveStatusEnum.getOptions(t);

    const tableProps = compact
        ? { size: 'sm' as const, borderless: true, className: 'align-middle mb-0' }
        : { bordered: true, hover: true, className: 'align-middle mb-0 shadow-sm' };

    return (
        <Stack className="table-responsive-custom">
            <Table {...tableProps}>
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {participants.length === 0 ? (
                        <EmptyTableRow colSpan={3} />
                    ) : (
                        participants.map((participant) => (
                            <Fragment key={participant.id}>
                                <TableRow className={compact ? 'border-top' : undefined}>
                                    <TableCell>
                                        <UserLink user={relatedUsers[participant.userId]} />
                                    </TableCell>
                                    <TableCell>
                                        <EnumBadge options={statusOptions} value={participant.status} />
                                    </TableCell>
                                    <TableCell className="text-end">
                                        {(typeof canManage === 'function' ? canManage(participant) : canManage) && (
                                            <StatusButtons
                                                options={statusOptions}
                                                current={participant.status}
                                                canSelect={canSelectStatus}
                                                onSelect={(status) => onUpdateStatus(participant.id, status)}
                                                disabled={actionLoading === participant.id}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                                {renderDetails?.(participant)}
                            </Fragment>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
