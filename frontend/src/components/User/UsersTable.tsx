import React from 'react';
import { Stack, Table, Image, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

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
                        <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="text-center">
                                    {u.profilePhoto ? (
                                        <Image
                                            src={`data:image/webp;base64,${u.profilePhoto}`}
                                            roundedCircle
                                            className="feed-avatar-32 object-fit-cover"
                                        />
                                    ) : (
                                        <Stack as="span" className="text-muted">
                                            -
                                        </Stack>
                                    )}
                                </TableCell>
                                <TableCell>{u.firstName}</TableCell>
                                <TableCell>{u.lastName}</TableCell>
                                <TableCell className="small">{u.email}</TableCell>
                                <TableCell className="small">
                                    {GenderEnum.getOptions(t).find((o) => o.value === u.gender)?.label || u.gender}
                                </TableCell>
                                <TableCell className="small">
                                    {CountryEnum.getOptions(t).find((o) => o.value === u.country)?.label || u.country}
                                </TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {UserStatusEnum.getOptions(t).find((o) => o.value === u.status)?.label ||
                                            u.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(u.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    <Link
                                        to={`/users/${u.link}`}
                                        className="btn btn-sm btn-outline-primary rounded-circle shadow-sm"
                                    >
                                        <BootstrapIcon name="box-arrow-in-right" />
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
