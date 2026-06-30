import React from 'react';
import { Table, Stack, Image, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { PageResponse } from '../../api/responses/PageResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface PagesTableProps {
    pages: PageResponse[];
}

export const PagesTable: React.FC<PagesTableProps> = ({ pages }) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                        <TableHeaderCell>{t('title')}</TableHeaderCell>
                        <TableHeaderCell>{t('link')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell className="text-end" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pages.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        pages.map((pageObj) => (
                            <TableRow key={pageObj.id}>
                                <TableCell className="text-center feed-photo-cell">
                                    {pageObj.profilePhoto ? (
                                        <Image
                                            src={`data:image/webp;base64,${pageObj.profilePhoto}`}
                                            roundedCircle
                                            fluid
                                            className="feed-photo shadow-sm"
                                        />
                                    ) : (
                                        <Stack as="span" className="text-muted">
                                            -
                                        </Stack>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Link to={`/pages/${pageObj.link}`} className="text-decoration-none">
                                        {pageObj.title}
                                    </Link>
                                </TableCell>
                                <TableCell className="small">@{pageObj.link}</TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find((opt) => opt.value === pageObj.status)
                                            ?.label || pageObj.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(pageObj.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    <Link
                                        to={`/pages/${pageObj.link}`}
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
