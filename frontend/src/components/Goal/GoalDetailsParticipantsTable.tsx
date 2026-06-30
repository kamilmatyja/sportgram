import React from 'react';
import { Table, Stack, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { GoalParticipantResponse } from '../../api/responses/GoalParticipantResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface GoalDetailsParticipantsTableProps {
    participants: GoalParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    canManage: boolean;
    actionLoading: string | null;
    onUpdateStatus: (participantId: string, status: number) => void;
}

export const GoalDetailsParticipantsTable: React.FC<GoalDetailsParticipantsTableProps> = ({
    participants,
    relatedUsers,
    canManage,
    actionLoading,
    onUpdateStatus,
}) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {participants.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        participants.map((p) => {
                            const u = p.user ?? relatedUsers?.[p.userId];

                            return (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        {u ? (
                                            <Link to={`/users/${u.link}`} className="text-decoration-none">
                                                {u.firstName} {u.lastName}
                                            </Link>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge bg="light" text="dark" className="border profile-theme-border">
                                            {SaveStatusEnum.getOptions(t).find((opt) => opt.value === p.status)
                                                ?.label || p.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <Stack direction="horizontal" gap={1} className="justify-content-end">
                                            {canManage &&
                                                SaveStatusEnum.getOptions(t)
                                                    .filter(
                                                        (opt) =>
                                                            opt.value !== p.status &&
                                                            opt.value !== SaveStatusEnum.PENDING,
                                                    )
                                                    .map((opt) => (
                                                        <Button
                                                            key={opt.value}
                                                            variant="profile-outline-primary"
                                                            className="btn-xs py-0 px-2"
                                                            disabled={actionLoading === p.id}
                                                            onClick={() => onUpdateStatus(p.id, opt.value)}
                                                        >
                                                            {opt.label}
                                                        </Button>
                                                    ))}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
