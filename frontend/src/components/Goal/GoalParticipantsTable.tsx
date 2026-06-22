import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {GoalParticipantResponse} from '../../api/responses/GoalParticipantResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {SaveStatusEnum} from '../../enums/SaveStatusEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table';
import {Table, Stack, Button, Badge} from 'react-bootstrap';

interface GoalParticipantsTableProps {
    participants: GoalParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateParticipantStatus: (participantId: string, status: number) => void;
    onUpdateResultStatus: (resultId: string, status: number) => void;
}

export const GoalParticipantsTable: React.FC<GoalParticipantsTableProps> = ({
                                                                                participants,
                                                                                relatedUsers,
                                                                                currentUser,
                                                                                actionLoading,
                                                                                onUpdateParticipantStatus,
                                                                                onUpdateResultStatus
                                                                            }) => {
    const {t} = useTranslation();

    return (
        <Stack className="table-responsive">
            <Table size="sm" borderless className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {participants.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : participants.map(p => {
                        const u = relatedUsers[p.userId];
                        const isOwner = currentUser?.id === p.userId;

                        return (
                            <React.Fragment key={p.id}>
                                <TableRow>
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
                                    <TableCell>
                                        {isOwner && SaveStatusEnum.getOptions(t)
                                            .filter(opt => opt.value !== p.status && opt.value !== SaveStatusEnum.PENDING)
                                            .map(opt => (
                                                <Button
                                                    key={opt.value}
                                                    variant="profile-outline-primary"
                                                    size="sm"
                                                    className="btn-xs py-0 px-2 me-1"
                                                    disabled={actionLoading === p.id}
                                                    onClick={() => onUpdateParticipantStatus(p.id, opt.value)}
                                                >
                                                    {opt.label}
                                                </Button>
                                            ))}
                                    </TableCell>
                                </TableRow>
                                {p.results && p.results.length > 0 && p.results.map(r => (
                                    <TableRow key={r.id} className="bg-light border-bottom">
                                        <TableCell className="text-end text-muted small pe-3">
                                            <BootstrapIcon name="arrow-return-right" className="me-1" />
                                            {t('results')}:
                                        </TableCell>
                                        <TableCell colSpan={2}>
                                            <Stack direction="horizontal" gap={3} className="align-items-center">
                                                <Stack as="span" className="small">
                                                    <Stack as="strong">{t('distance')}:</Stack> {r.distance}m
                                                </Stack>
                                                <Stack as="span" className="small">
                                                    <Stack as="strong">{t('time')}:</Stack> {r.time}s
                                                </Stack>
                                                <Badge bg="light" text="dark" className="border ms-2">
                                                    {SaveStatusEnum.getOptions(t).find(opt => opt.value === r.status)?.label || r.status}
                                                </Badge>
                                                <Stack className="ms-auto" direction="horizontal">
                                                    {isOwner && SaveStatusEnum.getOptions(t)
                                                        .filter(opt => opt.value !== r.status && opt.value !== SaveStatusEnum.PENDING)
                                                        .map(opt => (
                                                            <Button
                                                                key={opt.value}
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                className="btn-xs py-0 px-2 ms-1"
                                                                disabled={actionLoading === r.id}
                                                                onClick={() => onUpdateResultStatus(r.id, opt.value)}
                                                            >
                                                                {opt.label}
                                                            </Button>
                                                        ))}
                                                </Stack>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </Stack>
    );
};