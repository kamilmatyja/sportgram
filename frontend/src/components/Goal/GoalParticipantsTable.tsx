import React from 'react';
import { Table, Stack, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { GoalParticipantResponse } from '../../api/responses/GoalParticipantResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface GoalParticipantsTableProps {
    participants: GoalParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    canManage: boolean;
    actionLoading: string | null;
    onUpdateParticipantStatus: (participantId: string, status: number) => void;
    onUpdateResultStatus: (resultId: string, status: number) => void;
}

export const GoalParticipantsTable: React.FC<GoalParticipantsTableProps> = ({
    participants,
    relatedUsers,
    canManage,
    actionLoading,
    onUpdateParticipantStatus,
    onUpdateResultStatus,
}) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
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

                            return (
                                <React.Fragment key={p.id}>
                                    <TableRow className="border-top">
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
                                                            opt.value !== p.status &&
                                                            opt.value !== SaveStatusEnum.PENDING,
                                                    )
                                                    .map((opt) => (
                                                        <Button
                                                            key={opt.value}
                                                            variant="profile-outline-primary"
                                                            className="btn-xs py-0 px-2 ms-1"
                                                            disabled={actionLoading === p.id}
                                                            onClick={() => onUpdateParticipantStatus(p.id, opt.value)}
                                                        >
                                                            {opt.label}
                                                        </Button>
                                                    ))}
                                        </TableCell>
                                    </TableRow>
                                    {p.results?.map((r) => (
                                        <TableRow key={r.id} className="bg-light">
                                            <TableCell colSpan={3} className="ps-4">
                                                <Stack
                                                    direction="horizontal"
                                                    gap={3}
                                                    className="small align-items-center"
                                                >
                                                    <BootstrapIcon name="arrow-return-right" className="text-muted" />
                                                    <Stack direction="horizontal" gap={2}>
                                                        <Stack as="strong">{t('results')}:</Stack>
                                                        <Stack as="span">
                                                            {r.distance}m / {r.time}s
                                                        </Stack>
                                                    </Stack>
                                                    <Badge bg="white" text="dark" className="border ms-2">
                                                        {SaveStatusEnum.getOptions(t).find(
                                                            (opt) => opt.value === r.status,
                                                        )?.label || r.status}
                                                    </Badge>
                                                    <Stack className="ms-auto" direction="horizontal" gap={1}>
                                                        {canManage &&
                                                            SaveStatusEnum.getOptions(t)
                                                                .filter(
                                                                    (opt) =>
                                                                        opt.value !== r.status &&
                                                                        opt.value !== SaveStatusEnum.PENDING,
                                                                )
                                                                .map((opt) => (
                                                                    <Button
                                                                        key={opt.value}
                                                                        variant="outline-secondary"
                                                                        className="btn-xs py-0 px-1"
                                                                        disabled={actionLoading === r.id}
                                                                        onClick={() =>
                                                                            onUpdateResultStatus(r.id, opt.value)
                                                                        }
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
                        })
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
