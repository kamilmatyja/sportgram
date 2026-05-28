import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {formatDate} from '../../utils/dateFormat';
import {Pagination} from '../Common/Pagination';

interface PageEventsTableProps {
    events: EventResponse[];
    eventsLoading: boolean;
    eventPage: number;
    eventLimit: number;
    eventSort: string;
    eventFilters: EventFilterQuery;
    handleEventFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleEventSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventPrevPage: () => void;
    handleEventNextPage: () => void;
}

export const PageEventsTable: React.FC<PageEventsTableProps> = ({
                                                                    events,
                                                                    eventsLoading,
                                                                    eventPage,
                                                                    eventLimit,
                                                                    eventSort,
                                                                    eventFilters,
                                                                    handleEventFilterChange,
                                                                    handleEventSortChange,
                                                                    handleEventLimitChange,
                                                                    handleEventPrevPage,
                                                                    handleEventNextPage
                                                                }) => {
    const {t} = useTranslation();

    return (
        <div className="card shadow-sm">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 text-profile-primary fw-bold">{t('events')}</h5>
                </div>

                <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                    <input name="title" placeholder={t('title')} value={eventFilters.title || ''}
                           onChange={handleEventFilterChange} className="form-control w-auto"/>
                    <input name="link" placeholder={t('link')} value={eventFilters.link || ''}
                           onChange={handleEventFilterChange} className="form-control w-auto"/>
                    <select name="status" value={eventFilters.status || ''} onChange={handleEventFilterChange}
                            className="form-select w-auto">
                        <option value="">{t('status')}</option>
                        {ElementStatusEnum.getOptions(t).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select value={eventSort} onChange={handleEventSortChange} className="form-select w-auto ms-auto">
                        <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                        <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                        <option value="startedAt:desc">{t('startedAt')} Z-A</option>
                        <option value="startedAt:asc">{t('startedAt')} A-Z</option>
                    </select>
                    <select value={eventLimit} onChange={handleEventLimitChange} className="form-select w-auto">
                        {PaginationEnum.getOptions(t).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {eventsLoading && events.length === 0 ? (
                    <div className="text-center my-4">
                        <div className="spinner-border text-profile-primary"/>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive-custom">
                            <table className="table table-bordered table-hover align-middle mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th>{t('photo')}</th>
                                    <th>{t('title')}</th>
                                    <th>{t('location')}</th>
                                    <th>{t('startedAt')}</th>
                                    <th>{t('endedAt')}</th>
                                    <th>{t('status')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {events.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted">{t('noRecords')}</td>
                                    </tr>
                                ) : events.map(ev => (
                                    <tr key={ev.id}>
                                        <td className="text-center align-middle feed-photo-cell">
                                            <img src={`data:image/webp;base64,${ev.photo}`} alt="Photo"
                                                 className="w-100 h-100 object-fit-cover"/>
                                        </td>
                                        <td>
                                            <a href={`/events/${ev.link}`}
                                               className="btn btn-link p-0 text-decoration-none">
                                                {ev.title}
                                            </a>
                                        </td>
                                        <td>{ev.location}</td>
                                        <td>{formatDate(ev.startedAt)}</td>
                                        <td>{formatDate(ev.endedAt)}</td>
                                        <td>
                                            <span className="badge bg-light text-dark border profile-theme-border">
                                                {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(ev.status))?.label || ev.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3">
                            <Pagination page={eventPage} hasMore={events.length >= eventLimit}
                                        onPrevPage={handleEventPrevPage} onNextPage={handleEventNextPage}/>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};