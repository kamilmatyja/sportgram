import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { Stack, Button } from 'react-bootstrap';

interface PaginationProps {
    page: number;
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, hasMore, onPrevPage, onNextPage }) => {
    const { t } = useTranslation();

    return (
        <Stack direction="horizontal" gap={3} className="justify-content-center mb-3">
            <Button variant="outline-primary" disabled={page === 1} onClick={onPrevPage}>
                {t('prev')}
            </Button>
            <Stack direction="horizontal" className="fw-bold">
                {t('page')} {page}
            </Stack>
            <Button variant="outline-primary" disabled={!hasMore} onClick={onNextPage}>
                {t('next')}
            </Button>
        </Stack>
    );
};