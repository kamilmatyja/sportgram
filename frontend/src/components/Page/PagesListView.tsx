import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { PageResponse } from '../../api/responses/PageResponse';
import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { Pagination } from '../Common/Pagination';
import { PagesFilterBar } from './PagesFilterBar';
import { PagesTable } from './PagesTable';

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
    const { t } = useTranslation();

    return (
        <div className="container mt-5 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0 text-profile-primary fw-bold">{t('pages')}</h2>
                {isOrganizer && (
                    <button className="btn btn-primary" onClick={onAddClick}>
                        {t('addPage')}
                    </button>
                )}
            </div>

            <PagesFilterBar
                filters={filters}
                sort={sort}
                limit={limit}
                onFilterChange={onFilterChange}
                onSortChange={onSortChange}
                onLimitChange={onLimitChange}
            />

            {loading && pages.length === 0 ? (
                <div className="text-center mt-4">
                    <div className="spinner-border text-primary" />
                </div>
            ) : error ? (
                <div className="alert alert-danger mt-3">{t(error)}</div>
            ) : (
                <>
                    <PagesTable pages={pages} />
                    <div className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={pages.length >= limit}
                            onPrevPage={onPrevPage}
                            onNextPage={onNextPage}
                        />
                    </div>
                </>
            )}
        </div>
    );
};