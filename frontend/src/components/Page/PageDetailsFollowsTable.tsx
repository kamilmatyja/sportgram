import React from 'react';
import { Table, Stack, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { PageFollowResponse } from '../../api/responses/PageFollowResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface PageDetailsFollowsTableProps {
    follows: PageFollowResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateStatus: (followId: string, status: number) => void;
}

export const PageDetailsFollowsTable: React.FC<PageDetailsFollowsTableProps> = ({
    follows,
    relatedUsers,
    currentUser,
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
                    {follows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        follows.map((f) => {
                            const u = relatedUsers[f.userId];
                            const isOwner = currentUser?.id === f.userId;

                            return (
                                <TableRow key={f.id}>
                                    <TableCell>
                                        {u ? (
                                            <Link to={`/users/${u.link}`} className="text-decoration-none">
                                                {u.firstName} {u.lastName}
                                            </Link>
                                        ) : (
                                            <Stack as="small" className="text-muted">-</Stack>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge bg="light" text="dark" className="border profile-theme-border">
                                            {PageFollowStatusEnum.getOptions(t).find((opt) => opt.value === f.status)
                                                ?.label || f.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        <Stack direction="horizontal" gap={1} className="justify-content-end">
                                            {isOwner &&
                                                PageFollowStatusEnum.getOptions(t)
                                                    .filter(
                                                        (opt) =>
                                                            opt.value !== f.status &&
                                                            opt.value !== PageFollowStatusEnum.PENDING,
                                                    )
                                                    .map((opt) => (
                                                        <Button
                                                            key={opt.value}
                                                            variant="profile-outline-primary"
                                                            className="btn-xs py-0 px-2"
                                                            disabled={actionLoading === f.id}
                                                            onClick={() => onUpdateStatus(f.id, opt.value)}
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
