import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { EventResponse } from '../../api/responses/EventResponse';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { Link } from 'react-router-dom';

interface EventsTableProps {
    events: EventResponse[];
}

export const EventsTable: React.FC<EventsTableProps> = ({ events }) => {
    const { t } = useTranslation();

    if (events.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle">
                    <tbody>
                    <tr>
                        <td colSpan={7} className="text-center text-muted">{t('noEvents')}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                <tr>
                    <th>{t('photo')}</th>
                    <th>{t('title')}</th>
                    <th>{t('location')}</th>
                    <th>{t('startedAt')}</th>
                    <th>{t('endedAt')}</th>
                    <th>{t('status')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {events.map(ev => (
                    <tr key={ev.id}>
                        <td className="text-center align-middle feed-photo-cell">
                            {ev.photo ? (
                                <img src={`data:image/webp;base64,${ev.photo}`} alt="Photo" className="w-100 h-100 object-fit-cover rounded" />
                            ) : (
                                <span className="text-muted">-</span>
                            )}
                        </td>
                        <td>
                            <Link to={`/events/${ev.link}`} className="btn btn-link p-0 text-decoration-none fw-bold">
                                {ev.title}
                            </Link>
                        </td>
                        <td>{ev.location}</td>
                        <td>{formatDate(ev.startedAt)}</td>
                        <td>{formatDate(ev.endedAt)}</td>
                        <td>{ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(ev.status))?.label || ev.status}</td>
                        <td className="text-end">
                            <Link to={`/events/${ev.link}`} className="btn btn-sm btn-outline-primary" title={t('details')}>
                                <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i>
                                <span className="visually-hidden">{t('details')}</span>
                            </Link>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};