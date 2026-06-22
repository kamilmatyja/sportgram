import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {TrainingParticipantResponse} from '../../api/responses/TrainingParticipantResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {SaveStatusEnum} from '../../enums/SaveStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table';
import {Stack, Table, Badge, Button} from 'react-bootstrap';

interface TrainingDetailsParticipantsTableProps {
    participants: TrainingParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateStatus: (participantId: string, status: number) => void;
}

export const TrainingDetailsParticipantsTable: React.FC<TrainingDetailsParticipantsTableProps> = ({
                                                                                                      participants,
                                                                                                      relatedUsers,
                                                                                                      currentUser,
                                                                                                      actionLoading,
                                                                                                      onUpdateStatus
                                                                                                  }) => {
    const {t} = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {participants.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : participants.map(p => {
                        const u = relatedUsers[p.userId];
                        const isOwnerOfRecord = currentUser?.id === p.userId;

                        return (
                            <TableRow key={p.id}>
                                <TableCell>
                                    {u ? (
                                        <Link to={`/users/${u.link}`} className="text-decoration-none">
                                            {u.firstName} {u.lastName}
                                        </Link>
                                    ) : p.userId}
                                </TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {SaveStatusEnum.getOptions(t).find(opt => opt.value === p.status)?.label || p.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatDate(p.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    <Stack direction="horizontal" className="justify-content-end gap-1 flex-wrap">
                                        {isOwnerOfRecord && SaveStatusEnum.getOptions(t)
                                            .filter(opt => opt.value !== p.status && opt.value !== SaveStatusEnum.PENDING)
                                            .map(opt => (
                                                <Button
                                                    key={opt.value}
                                                    variant="profile-outline-primary"
                                                    size="sm"
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
                    })}
                </TableBody>
            </Table>
        </Stack>
    );
};