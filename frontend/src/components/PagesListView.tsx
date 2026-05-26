import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {PageResponse} from '../api/responses/PageResponse';
import {PageFilterQuery} from '../api/queries/PageFilterQuery';
import {ElementStatusEnum} from '../enums/ElementStatusEnum';
import {PaginationEnum} from '../enums/PaginationEnum';
import {formatDate} from '../utils/dateFormat';

interface PagesListViewProps {
    pages: PageResponse[];
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: PageFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
}

export const PagesListView: React.FC<PagesListViewProps> = ({
                                                                pages,
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
                <h2 className="mb-0">{t('pages')}</h2>
                {isOrganizer && (
                    <button className="btn btn-primary" onClick={onAddClick}>
                        {t('addPage')}
                    </button>
                )}
            </div>

            <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                <input name="title" placeholder={t('title')} value={filters.title || ''} onChange={onFilterChange} className="form-control w-auto"/>
                <input name="link" placeholder={t('link')} value={filters.link || ''} onChange={onFilterChange} className="form-control w-auto"/>
                <select name="status" value={filters.status || ''} onChange={onFilterChange} className="form-select w-auto">
                    <option value="">{t('status')}</option>
                    {ElementStatusEnum.getOptions(t).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <select value={sort} onChange={onSortChange} className="form-select w-auto ms-auto">
                    <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                    <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                    <option value="title:desc">{t('title')} Z-A</option>
                    <option value="title:asc">{t('title')} A-Z</option>
                </select>
                <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                    {PaginationEnum.getOptions(t).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {loading && pages.length === 0 ? <div className="text-center"><div className="spinner-border"/></div> : error ? <div className="alert alert-danger">{t(error)}</div> : (
                <>
                    <div className="table-responsive-custom">
                        <table className="table table-bordered table-hover align-middle">
                            <thead className="table-light">
                            <tr>
                                <th>{t('photo')}</th>
                                <th>{t('title')}</th>
                                <th>{t('link')}</th>
                                <th>{t('status')}</th>
                                <th>{t('createdAt')}</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {pages.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted">{t('noPages')}</td>
                                </tr>
                            ) : pages.map(pageObj => (
                                <tr key={pageObj.id}>
                                    <td className="text-center align-middle feed-photo-cell">
                                        {pageObj.profilePhoto ? (
                                            <img src={`data:image/webp;base64,${pageObj.profilePhoto}`} alt="page" className="rounded-circle img-fluid feed-photo"/>
                                        ) : (
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td>
                                        <a href={`/pages/${pageObj.link}`} className="btn btn-link p-0 text-decoration-none">
                                            {pageObj.title}
                                        </a>
                                    </td>
                                    <td>{pageObj.link}</td>
                                    <td>{ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(pageObj.status))?.label || pageObj.status}</td>
                                    <td>{formatDate(pageObj.createdAt)}</td>
                                    <td className="text-end">
                                        <a href={`/pages/${pageObj.link}`} className="btn btn-sm btn-outline-primary" title={t('profile')}>
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
                        <button className="btn btn-outline-primary mx-2" disabled={page === 1} onClick={onPrevPage}>{t('prev')}</button>
                        <span>{t('page')} {page}</span>
                        <button className="btn btn-outline-primary mx-2" disabled={pages.length < limit} onClick={onNextPage}>{t('next')}</button>
                    </div>
                </>
            )}
        </div>
    );
};