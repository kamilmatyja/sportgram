import React from 'react';
import { Table, Stack, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { TrainingParticipantResponse } from '../../api/responses/TrainingParticipantResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface TrainingParticipantsTableProps {
    participants: TrainingParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onUpdateStatus: (participantId: string, status: number) => void;
}

export const TrainingParticipantsTable: React.FC<TrainingParticipantsTableProps> = ({
    participants,
    relatedUsers,
    currentUser,
    isMyProfile,
    isAdmin,
    actionLoading,
    onUpdateStatus,
}) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive">
            <Table size="sm" borderless className="align-middle mb-0">
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
                            const u = relatedUsers[p.userId];
                            const isOwner = currentUser?.id === p.userId;
                            const canManage = isMyProfile || isAdmin || isOwner;

                            return (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        {u ? (
                                            <Link to={`/users/${u.link}`} className="text-decoration-none">
                                                {u.firstName} {u.lastName}
                                            </Link>
                                        ) : (
                                            <Stack as="span" className="text-muted">
                                                {p.userId}
                                            </Stack>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge bg="light" text="dark" className="border profile-theme-border">
                                            {SaveStatusEnum.getOptions(t).find((opt) => opt.value === p.status)
                                                ?.label || p.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        {canManage &&
                                            SaveStatusEnum.getOptions(t)
                                                .filter(
                                                    (opt) =>
                                                        opt.value !== p.status && opt.value !== SaveStatusEnum.PENDING,
                                                )
                                                .map((opt) => (
                                                    <Button
                                                        key={opt.value}
                                                        variant="profile-outline-primary"
                                                        size="sm"
                                                        className="btn-xs py-0 px-2 ms-1"
                                                        disabled={actionLoading === p.id}
                                                        onClick={() => onUpdateStatus(p.id, opt.value)}
                                                    >
                                                        {opt.label}
                                                    </Button>
                                                ))}
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
