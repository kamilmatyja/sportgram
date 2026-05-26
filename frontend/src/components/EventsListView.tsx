import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {EventResponse} from '../api/responses/EventResponse';
import {EventFilterQuery} from '../api/queries/EventFilterQuery';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {PaginationEnum} from '../enums/PaginationEnum';
import {formatDate} from '../utils/dateFormat';

interface EventsListViewProps {
    events: EventResponse[];
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: EventFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
}

export const EventsListView: React.FC<EventsListViewProps> = ({
                                                                  events,
                                                                  isOrganizer,
                                                                  loading,
                                                                  error,
                                                                  page,
                                                                  limit,
                                                                  sort,
                                                                  filters,
                                                                  onFilterChange,
                                                                  onSortChange,
                                                                  onLimitChange,
                                                                  onPrevPage,
                                                                  onNextPage,
                                                                  onAddClick
                                                              }) => {
    const {t} = useTranslation();

    return (
        <div className="container mt-5 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">{t('events')}</h2>
                {isOrganizer && (
                    <button className="btn btn-primary" onClick={onAddClick}>
                        {t('addEvent')}
                    </button>
                )}
            </div>

            <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                <input name="title" placeholder={t('title')} value={filters.title || ''} onChange={onFilterChange}
                       className="form-control w-auto"/>
                <input name="link" placeholder={t('link')} value={filters.link || ''} onChange={onFilterChange}
                       className="form-control w-auto"/>
                <select name="status" value={filters.status || ''} onChange={onFilterChange}
                        className="form-select w-auto">
                    <option value="">{t('status')}</option>
                    {ElementStatusEnum.getOptions(t).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <select value={sort} onChange={onSortChange} className="form-select w-auto ms-auto">
                    <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                    <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                    <option value="startedAt:desc">{t('startedAt')} Z-A</option>
                    <option value="startedAt:asc">{t('startedAt')} A-Z</option>
                </select>
                <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                    {PaginationEnum.getOptions(t).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {loading && events.length === 0 ? <div className="text-center">
                <div className="spinner-border"/>
            </div> : error ? <div className="alert alert-danger">{t(error)}</div> : (
                <>
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
                            {events.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted">{t('noEvents')}</td>
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
                                    <td>{ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(ev.status))?.label || ev.status}</td>
                                    <td className="text-end">
                                        <a href={`/events/${ev.link}`} className="btn btn-sm btn-outline-primary"
                                           title={t('profile')}>
                                            <i className="bi bi-box-arrow-in-right" aria-hidden="true"></i>
                                            <span className="visually-hidden">{t('profile')}</span>
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <button className="btn btn-outline-primary mx-2" disabled={page === 1}
                                onClick={onPrevPage}>{t('prev')}</button>
                        <span>{t('page')} {page}</span>
                        <button className="btn btn-outline-primary mx-2" disabled={events.length < limit}
                                onClick={onNextPage}>{t('next')}</button>
                    </div>
                </>
            )}
        </div>
    );
};