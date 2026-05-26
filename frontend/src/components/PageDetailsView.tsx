import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {PageResponse} from '../api/responses/PageResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {EventResponse} from '../api/responses/EventResponse';
import {ColorEnum} from '../enums/ColorEnum';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {EventFilterQuery} from '../api/queries/EventFilterQuery';
import {PaginationEnum} from '../enums/PaginationEnum';
import {formatDate} from '../utils/dateFormat';

interface PageDetailsViewProps {
    pageObj: PageResponse | null;
    ownerUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    isParticipantOfPage: boolean;
    loading: boolean;
    error: string | null;
    onManageClick: (page: PageResponse) => void;

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

export const PageDetailsView: React.FC<PageDetailsViewProps> = ({
                                                                    pageObj,
                                                                    ownerUser,
                                                                    relatedUsers,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    isParticipantOfPage,
                                                                    loading,
                                                                    error,
                                                                    onManageClick,
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

    if (loading) return <div className="container mt-5 text-center"><div className="spinner-border"/></div>;

    if (error || !pageObj || !ownerUser) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const hexColor = ColorEnum.getHex(pageObj.color);
    const canManage = isMyProfile || isAdmin || isParticipantOfPage;

    return (
        <div className="container mt-4 mb-5" style={{'--theme-color': hexColor} as React.CSSProperties}>
            <div className="card shadow-sm mb-4">
                <div className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                    <img src={`data:image/webp;base64,${pageObj.backgroundPhoto}`} alt="Background" className="w-100 h-100 object-fit-cover"/>
                </div>
                <div className="card-body position-relative pt-5">
                    <img src={`data:image/webp;base64,${pageObj.profilePhoto}`} alt="Profile" className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"/>
                    <div className="mt-3">
                        <h2 className="mb-0 profile-theme-text">{pageObj.title}</h2>
                        <p className="text-muted mb-0">@{pageObj.link}</p>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                <a href="/pages" className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('pages')}
                </a>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0">{t('details')}</h4>
                        {canManage && (
                            <button className="btn btn-profile-primary" onClick={() => onManageClick(pageObj)}>
                                <i className="bi bi-gear me-1"></i> {t('manage')}
                            </button>
                        )}
                    </div>

                    <div className="mb-4 border-bottom pb-4">
                        <p className="mb-3">{pageObj.description}</p>
                        <div className="d-flex align-items-center gap-2 mt-2">
                            <strong>{t('pageStatus')}: </strong>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(pageObj.status))?.label || pageObj.status}
                            </span>
                        </div>
                    </div>

                    <div className="mb-0">
                        <h5 className="mb-3">{t('participants')}</h5>
                        <div className="table-responsive-custom">
                            <table className="table table-bordered table-hover align-middle mb-0">
                                <thead className="table-light">
                                <tr>
                                    <th>{t('user')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('createdAt')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pageObj.participants.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center text-muted">{t('noParticipants')}</td></tr>
                                ) : pageObj.participants.map(p => {
                                    const u = relatedUsers[p.userId];
                                    return (
                                        <tr key={p.id}>
                                            <td>
                                                {u ? <a href={`/users/${u.link}`} className="btn btn-link p-0 text-decoration-none">{u.firstName} {u.lastName}</a> : p.userId}
                                            </td>
                                            <td>{SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(p.status))?.label || p.status}</td>
                                            <td>{formatDate(p.createdAt)}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0">{t('events')}</h4>
                    </div>

                    <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                        <input name="title" placeholder={t('title')} value={eventFilters.title || ''} onChange={handleEventFilterChange} className="form-control w-auto"/>
                        <input name="link" placeholder={t('link')} value={eventFilters.link || ''} onChange={handleEventFilterChange} className="form-control w-auto"/>
                        <select name="status" value={eventFilters.status || ''} onChange={handleEventFilterChange} className="form-select w-auto">
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

                    {eventsLoading && events.length === 0 ? <div className="text-center"><div className="spinner-border"/></div> : (
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
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {events.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center text-muted">{t('noEvents')}</td>
                                        </tr>
                                    ) : events.map(ev => (
                                        <tr key={ev.id}>
                                            <td className="text-center align-middle feed-photo-cell">
                                                <img src={`data:image/webp;base64,${ev.photo}`} alt="Photo" className="w-100 h-100 object-fit-cover"/>
                                            </td>
                                            <td>
                                                <a href={`/events/${ev.link}`} className="btn btn-link p-0 text-decoration-none">
                                                    {ev.title}
                                                </a>
                                            </td>
                                            <td>{ev.location}</td>
                                            <td>{formatDate(ev.startedAt)}</td>
                                            <td>{formatDate(ev.endedAt)}</td>
                                            <td>{ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(ev.status))?.label || ev.status}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <button className="btn btn-profile-outline-primary mx-2" disabled={eventPage === 1} onClick={handleEventPrevPage}>{t('prev')}</button>
                                <span>{t('page')} {eventPage}</span>
                                <button className="btn btn-profile-outline-primary mx-2" disabled={events.length < eventLimit} onClick={handleEventNextPage}>{t('next')}</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};