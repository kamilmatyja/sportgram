import React from 'react';
import { Stack, Table } from 'react-bootstrap';

import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { getOptionLabel } from '../../utils/options';
import { Base64Image } from '../Common/Base64Image';
import { EnumBadge } from '../Common/EnumBadge';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UsersTableProps {
    users: UserResponse[];
}

export const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                        <TableHeaderCell>{t('firstName')}</TableHeaderCell>
                        <TableHeaderCell>{t('lastName')}</TableHeaderCell>
                        <TableHeaderCell>{t('email')}</TableHeaderCell>
                        <TableHeaderCell>{t('gender')}</TableHeaderCell>
                        <TableHeaderCell>{t('country')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell className="text-end" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.length === 0 ? (
                        <EmptyTableRow colSpan={9} />
                    ) : (
                        users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="text-center">
                                    <Base64Image
                                        data={u.profilePhoto}
                                        roundedCircle
                                        className="feed-avatar-32 object-fit-cover"
                                        fallback={
                                            <Stack as="span" className="text-muted">
                                                -
                                            </Stack>
                                        }
                                    />
                                </TableCell>
                                <TableCell>{u.firstName}</TableCell>
                                <TableCell>{u.lastName}</TableCell>
                                <TableCell className="small">{u.email}</TableCell>
                                <TableCell className="small">
                                    {getOptionLabel(GenderEnum.getOptions(t), u.gender)}
                                </TableCell>
                                <TableCell className="small">
                                    {getOptionLabel(CountryEnum.getOptions(t), u.country)}
                                </TableCell>
                                <TableCell>
                                    <EnumBadge options={UserStatusEnum.getOptions(t)} value={u.status} />
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(u.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    <IconButton
                                        icon="box-arrow-in-right"
                                        to={`/users/${u.link}`}
                                        variant="outline-primary"
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
