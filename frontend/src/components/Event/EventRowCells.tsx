import React from 'react';
import { Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { Base64Image } from '../Common/Base64Image';
import { EnumBadge } from '../Common/EnumBadge';
import { TableCell, TableHeaderCell } from '../Common/Table';

export const EventHeaderCells: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <TableHeaderCell>{t('photo')}</TableHeaderCell>
            <TableHeaderCell>{t('title')}</TableHeaderCell>
            <TableHeaderCell>{t('location')}</TableHeaderCell>
            <TableHeaderCell>{t('startedAt')}</TableHeaderCell>
            <TableHeaderCell>{t('endedAt')}</TableHeaderCell>
            <TableHeaderCell>{t('status')}</TableHeaderCell>
        </>
    );
};

export const EventRowCells: React.FC<{ eventObj: EventResponse }> = ({ eventObj }) => {
    const { t } = useTranslation();

    return (
        <>
            <TableCell className="feed-photo-cell text-center">
                <Base64Image
                    data={eventObj.photo}
                    fallback={
                        <Stack as="span" className="text-muted">
                            -
                        </Stack>
                    }
                    fluid
                    rounded
                    className="feed-photo shadow-sm"
                />
            </TableCell>
            <TableCell>
                <Link to={`/events/${eventObj.link}`} className="text-decoration-none">
                    {eventObj.title}
                </Link>
            </TableCell>
            <TableCell className="small">{eventObj.location}</TableCell>
            <TableCell className="small">{formatDate(eventObj.startedAt)}</TableCell>
            <TableCell className="small">{formatDate(eventObj.endedAt)}</TableCell>
            <TableCell>
                <EnumBadge options={ElementStatusEnum.getOptions(t)} value={eventObj.status} />
            </TableCell>
        </>
    );
};
