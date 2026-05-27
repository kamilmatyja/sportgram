import React from 'react';
import { useTranslation } from '../../context/TranslationContext';

interface PaginationProps {
    page: number;
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, hasMore, onPrevPage, onNextPage }) => {
    const { t } = useTranslation();

    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <button className="btn btn-outline-primary mx-2" disabled={page === 1} onClick={onPrevPage}>
                {t('prev')}
            </button>
            <span>{t('page')} {page}</span>
            <button className="btn btn-outline-primary mx-2" disabled={!hasMore} onClick={onNextPage}>
                {t('next')}
            </button>
        </div>
    );
};