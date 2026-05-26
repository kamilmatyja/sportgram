import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {PageResponse} from '../api/responses/PageResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {EventResponse} from '../api/responses/EventResponse';
import {PageBody} from '../api/body/PageBody';
import {ColorEnum} from '../enums/ColorEnum';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {SaveStatusEnum} from '../enums/SaveStatusEnum';
import {EventFilterQuery} from '../api/queries/EventFilterQuery';
import {PaginationEnum} from '../enums/PaginationEnum';
import {formatDate} from '../utils/dateFormat';

interface PageDetailsViewProps {
    pageObj: PageResponse | null;
    currentUser: UserResponse | null;
    availableUsers: UserResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    submitLoading: boolean;
    error: string | null;
    globalError: string;
    fieldErrors: Record<string, string | string[]>;
    successMsg: string;
    formData: PageBody;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleParticipantsChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEditSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    handleStatusSubmit: (newStatus: number) => void;
    handleParticipantStatusSubmit: (participantId: string, newStatus: number) => void;
    handleDelete: () => void;

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
                                                                    currentUser,
                                                                    availableUsers,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    loading,
                                                                    submitLoading,
                                                                    error,
                                                                    globalError,
                                                                    fieldErrors,
                                                                    successMsg,
                                                                    formData,
                                                                    handleChange,
                                                                    handleParticipantsChange,
                                                                    handleEditSubmit,
                                                                    handleStatusSubmit,
                                                                    handleParticipantStatusSubmit,
                                                                    handleDelete,
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

    if (error || !pageObj || !currentUser) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('error')}</div>;

    const hexColor = ColorEnum.getHex(pageObj.color);
    const myParticipant = pageObj.participants?.find(p => p.userId === currentUser.id);

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
                    <h4 className="mb-4">{t('managePage')}</h4>

                    {globalError && <div className="alert alert-danger">{t(globalError)}</div>}
                    {successMsg && <div className="alert alert-success">{t(successMsg)}</div>}

                    {isMyProfile ? (
                        <form id="edit-page-form" onSubmit={handleEditSubmit} className="mb-4 border-bottom pb-4">
                            <div className="mb-3">
                                <label className="form-label">{t('title')}</label>
                                <input type="text" name="title"
                                       className={`form-control ${fieldErrors.title ? 'is-invalid' : ''}`}
                                       value={formData.title} onChange={handleChange} required/>
                                {fieldErrors.title && <div className="invalid-feedback d-block">{fieldErrors.title}</div>}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('description')}</label>
                                <textarea name="description"
                                          className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                                          value={formData.description} onChange={handleChange} required rows={3}/>
                                {fieldErrors.description && <div className="invalid-feedback d-block">{fieldErrors.description}</div>}
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">{t('link')}</label>
                                    <input type="text" name="link"
                                           className={`form-control ${fieldErrors.link ? 'is-invalid' : ''}`}
                                           value={formData.link} onChange={handleChange} required/>
                                    {fieldErrors.link && <div className="invalid-feedback d-block">{fieldErrors.link}</div>}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('color')}</label>
                                    <select name="color"
                                            className={`form-select ${fieldErrors.color ? 'is-invalid' : ''}`}
                                            value={formData.color || ''} onChange={handleChange} required>
                                        <option value="">{t('selectOption')}</option>
                                        {ColorEnum.getOptions(t).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {fieldErrors.color && <div className="invalid-feedback d-block">{fieldErrors.color}</div>}
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">{t('profilePhoto')}</label>
                                    <input type="file" accept="image/*" name="profilePhoto"
                                           className={`form-control ${fieldErrors.profilePhoto ? 'is-invalid' : ''}`}
                                           onChange={handleChange}/>
                                    <div className="form-text">{t('photoOptional')}</div>
                                    {fieldErrors.profilePhoto && <div className="invalid-feedback d-block">{fieldErrors.profilePhoto}</div>}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">{t('backgroundPhoto')}</label>
                                    <input type="file" accept="image/*" name="backgroundPhoto"
                                           className={`form-control ${fieldErrors.backgroundPhoto ? 'is-invalid' : ''}`}
                                           onChange={handleChange}/>
                                    <div className="form-text">{t('photoOptional')}</div>
                                    {fieldErrors.backgroundPhoto && <div className="invalid-feedback d-block">{fieldErrors.backgroundPhoto}</div>}
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">{t('participants')}</label>
                                <select
                                    name="participants"
                                    className={`form-select ${fieldErrors.participants ? 'is-invalid' : ''}`}
                                    value={Array.isArray(formData.participants) ? formData.participants : []}
                                    onChange={handleParticipantsChange}
                                    multiple
                                >
                                    {availableUsers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.firstName} {u.lastName} ({u.link})
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.participants && <div className="invalid-feedback d-block">{fieldErrors.participants}</div>}
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitLoading}>
                                    {submitLoading ? t('sending') : t('delete')}
                                </button>
                                <button type="submit" className="btn btn-profile-primary" disabled={submitLoading}>
                                    {submitLoading ? t('sending') : t('saveChanges')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-4 border-bottom pb-4">
                            <p className="mb-0">{pageObj.description}</p>
                        </div>
                    )}

                    {(isMyProfile || isAdmin) && (
                        <div className="mb-4 border-bottom pb-4">
                            <h6 className="mb-3">{t('managePageStatus')}</h6>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <strong>{t('pageStatus')}:</strong>
                                <span className="me-2 badge bg-light text-dark border profile-theme-border">
                                    {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(pageObj.status))?.label || pageObj.status}
                                </span>
                                {ElementStatusEnum.getOptions(t)
                                    .filter(opt => opt.value !== pageObj.status)
                                    .filter(opt => isAdmin || (isMyProfile && opt.value !== ElementStatusEnum.REJECTED))
                                    .map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                            disabled={submitLoading}
                                            onClick={() => handleStatusSubmit(opt.value)}
                                        >
                                            {submitLoading ? t('loading') : opt.label}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}

                    {myParticipant && (
                        <div className="mb-4">
                            <h6 className="mb-3">{t('manageParticipantStatus')}</h6>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <strong>{t('participantStatus')}:</strong>
                                <span className="me-2 badge bg-light text-dark border profile-theme-border">
                                {SaveStatusEnum.getOptions(t).find(opt => String(opt.value) === String(myParticipant.status))?.label || myParticipant.status}
                            </span>
                                {SaveStatusEnum.getOptions(t)
                                    .filter(opt => opt.value !== myParticipant.status)
                                    .filter(opt => opt.value !== SaveStatusEnum.PENDING)
                                    .map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                            disabled={submitLoading}
                                            onClick={() => handleParticipantStatusSubmit(myParticipant.id, opt.value)}
                                        >
                                            {submitLoading ? t('loading') : opt.label}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}
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