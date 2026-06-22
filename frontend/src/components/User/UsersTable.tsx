import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {GenderEnum} from '../../enums/GenderEnum';
import {CountryEnum} from '../../enums/CountryEnum';
import {UserStatusEnum} from '../../enums/UserStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {Link} from 'react-router-dom';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table.tsx';
import {Stack, Table, Image, Badge} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UsersTableProps {
    users: UserResponse[];
}

export const UsersTable: React.FC<UsersTableProps> = ({users}) => {
    const {t} = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
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
                        <TableHeaderCell></TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : users.map(u => (
                        <TableRow key={u.id}>
                            <TableCell className="text-center">
                                {u.profilePhoto ? (
                                    <Image src={`data:image/webp;base64,${u.profilePhoto}`} alt="avatar"
                                           className="rounded-circle object-fit-cover feed-avatar-32"/>
                                ) : (
                                    <Stack as="span" className="text-muted">-</Stack>
                                )}
                            </TableCell>
                            <TableCell>{u.firstName}</TableCell>
                            <TableCell>{u.lastName}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{GenderEnum.getOptions(t).find(opt => String(opt.value) === String(u.gender))?.label || u.gender}</TableCell>
                            <TableCell>{CountryEnum.getOptions(t).find(opt => String(opt.value) === String(u.country))?.label || u.country}</TableCell>
                            <TableCell>
                                <Badge bg="light" text="dark" className="border profile-theme-border">
                                    {UserStatusEnum.getOptions(t).find(opt => String(opt.value) === String(u.status))?.label || u.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(u.createdAt)}</TableCell>
                            <TableCell className="text-end">
                                <Link to={`/users/${u.link}`} className="btn btn-sm btn-outline-primary"
                                      title={t('profile')}>
                                    <BootstrapIcon name="box-arrow-in-right" aria-hidden="true" />
                                    <Stack as="span" className="visually-hidden">{t('profile')}</Stack>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Stack>
    );
};