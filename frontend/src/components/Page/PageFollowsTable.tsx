import React from 'react';
import { Table, Stack } from 'react-bootstrap';

import { PageFollowResponse } from '../../api/responses/PageFollowResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { EnumBadge } from '../Common/EnumBadge';
import { StatusButtons } from '../Common/StatusButtons';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';
import { UserLink } from '../Common/UserLink';

interface PageFollowsTableProps {
    follows: PageFollowResponse[];
    relatedUsers: Record<string, UserResponse>;
    canManage: (follow: PageFollowResponse) => boolean;
    actionLoading: string | null;
    onUpdateStatus: (followId: string, status: number) => void;
    compact?: boolean;
}

const canSelectStatus = (status: number): boolean => status !== PageFollowStatusEnum.PENDING;

export const PageFollowsTable: React.FC<PageFollowsTableProps> = ({
    follows,
    relatedUsers,
    canManage,
    actionLoading,
    onUpdateStatus,
    compact = false,
}) => {
    const { t } = useTranslation();
    const statusOptions = PageFollowStatusEnum.getOptions(t);

    return (
        <Stack className="table-responsive-custom">
            <Table
                {...(compact ? { size: 'sm', borderless: true } : { bordered: true })}
                hover
                className={`align-middle mb-0 ${compact ? '' : 'shadow-sm'}`.trim()}
            >
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {follows.length === 0 ? (
                        <EmptyTableRow colSpan={3} />
                    ) : (
                        follows.map((follow) => (
                            <TableRow key={follow.id}>
                                <TableCell>
                                    <UserLink user={relatedUsers[follow.userId]} />
                                </TableCell>
                                <TableCell>
                                    <EnumBadge options={statusOptions} value={follow.status} />
                                </TableCell>
                                <TableCell className="text-end">
                                    {canManage(follow) && (
                                        <StatusButtons
                                            options={statusOptions}
                                            current={follow.status}
                                            canSelect={canSelectStatus}
                                            onSelect={(status) => onUpdateStatus(follow.id, status)}
                                            disabled={actionLoading === follow.id}
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
