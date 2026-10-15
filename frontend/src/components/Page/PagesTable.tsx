import React from 'react';
import { Table, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { PageResponse } from '../../api/responses/PageResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { Base64Image } from '../Common/Base64Image';
import { EnumBadge } from '../Common/EnumBadge';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

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
                        <EmptyTableRow colSpan={6} />
                    ) : (
                        pages.map((pageObj) => (
                            <TableRow key={pageObj.id}>
                                <TableCell className="text-center feed-photo-cell">
                                    <Base64Image
                                        data={pageObj.profilePhoto}
                                        fallback={
                                            <Stack as="span" className="text-muted">
                                                -
                                            </Stack>
                                        }
                                        roundedCircle
                                        fluid
                                        className="feed-photo shadow-sm"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Link to={`/pages/${pageObj.link}`} className="text-decoration-none">
                                        {pageObj.title}
                                    </Link>
                                </TableCell>
                                <TableCell className="small">@{pageObj.link}</TableCell>
                                <TableCell>
                                    <EnumBadge options={ElementStatusEnum.getOptions(t)} value={pageObj.status} />
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(pageObj.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    <IconButton
                                        icon="box-arrow-in-right"
                                        to={`/pages/${pageObj.link}`}
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
