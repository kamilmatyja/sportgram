import React from 'react';
import { Stack, Table } from 'react-bootstrap';

import { PushSubscriptionResponse } from '../../api/responses/PushSubscriptionResponse';
import { useTranslation } from '../../context/TranslationContext';
import { PushSubscriptionStatusEnum } from '../../enums/PushSubscriptionStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { EnumBadge } from '../Common/EnumBadge';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserPushSubscriptionsTableProps {
    subscriptions: PushSubscriptionResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (subscription: PushSubscriptionResponse) => void;
}

export const UserPushSubscriptionsTable: React.FC<UserPushSubscriptionsTableProps> = ({
    subscriptions,
    isMyProfile,
    isAdmin,
    onManageClick,
}) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('browserDevice')}</TableHeaderCell>
                        <TableHeaderCell>{t('endpoint')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {subscriptions.length === 0 ? (
                        <EmptyTableRow colSpan={5} />
                    ) : (
                        subscriptions.map((sub) => (
                            <TableRow key={sub.id}>
                                <TableCell className="small">{sub.userAgent || '-'}</TableCell>
                                <TableCell className="text-truncate">{sub.endpoint}</TableCell>
                                <TableCell>
                                    <EnumBadge options={PushSubscriptionStatusEnum.getOptions(t)} value={sub.status} />
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(sub.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    {(isMyProfile || isAdmin) && (
                                        <IconButton icon="gear" onClick={() => onManageClick(sub)} />
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
