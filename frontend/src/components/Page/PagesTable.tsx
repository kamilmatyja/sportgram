import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {PageResponse} from '../../api/responses/PageResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Html';
import {Table, Stack, Image, Badge} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface PagesTableProps {
    pages: PageResponse[];
}

export const PagesTable: React.FC<PagesTableProps> = ({pages}) => {
    const {t} = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                        <TableHeaderCell>{t('title')}</TableHeaderCell>
                        <TableHeaderCell>{t('link')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell></TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pages.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : pages.map(pageObj => (
                        <TableRow key={pageObj.id}>
                            <TableCell className="text-center align-middle feed-photo-cell">
                                {pageObj.profilePhoto ? (
                                    <Image src={`data:image/webp;base64,${pageObj.profilePhoto}`} alt="page"
                                           className="rounded-circle img-fluid feed-photo"/>
                                ) : (
                                    <Stack as="span" className="text-muted">-</Stack>
                                )}
                            </TableCell>
                            <TableCell>
                                <Link to={`/pages/${pageObj.link}`} className="btn btn-link p-0 text-decoration-none">
                                    {pageObj.title}
                                </Link>
                            </TableCell>
                            <TableCell>{pageObj.link}</TableCell>
                            <TableCell>
                                <Badge bg="light" text="dark" className="border profile-theme-border">
                                    {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(pageObj.status))?.label || pageObj.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(pageObj.createdAt)}</TableCell>
                            <TableCell className="text-end">
                                <Link to={`/pages/${pageObj.link}`} className="btn btn-sm btn-outline-primary"
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